import { prisma } from "./prisma";
import { PUNTOS_SIN_CAMBIO, PUNTOS_CON_CAMBIO } from "./config";
import { inicioDeCiclo, hoyBogota } from "./ciclo";

export type ErrorNegocio = { codigo: string; mensaje: string };

/**
 * Crea o actualiza el registro de UN día para un técnico.
 *
 * Reglas ya acordadas:
 * - Un solo registro por técnico por día (se corrige, no se duplica).
 * - Si quien carga es el propio técnico, la fecha de la visita tiene que
 *   ser HOY — no se permite cargar retroactivo.
 * - Si quien carga es el admin, puede especificar cualquier fecha (para
 *   cubrir el caso de un técnico que se olvidó), y queda registrado que
 *   fue el admin quien lo cargó (trazabilidad).
 */
export async function guardarRegistroDelDia(params: {
  usuarioId: string; // a quién pertenece la visita (el técnico)
  cargadoPorId: string; // quién está tipeando esto ahora
  esAdmin: boolean;
  fechaVisita: Date; // solo la parte de fecha importa
  cantidadSinCambio: number;
  cantidadConCambio: number;
}): Promise<{ ok: true; registro: any } | { ok: false; error: ErrorNegocio }> {
  const { usuarioId, cargadoPorId, esAdmin, cantidadSinCambio, cantidadConCambio } = params;

  if (cantidadSinCambio < 0 || cantidadConCambio < 0) {
    return { ok: false, error: { codigo: "NEGATIVO", mensaje: "Las cantidades no pueden ser negativas" } };
  }
  if (!Number.isInteger(cantidadSinCambio) || !Number.isInteger(cantidadConCambio)) {
    return { ok: false, error: { codigo: "NO_ENTERO", mensaje: "Las cantidades tienen que ser números enteros" } };
  }

  const fechaVisita = soloFecha(params.fechaVisita);
  const hoy = hoyBogota();

  // Regla acordada: un técnico solo puede cargar el día de hoy, no retroactivo.
  // El admin sí puede elegir cualquier fecha (para cubrir olvidos).
  if (!esAdmin && fechaVisita.getTime() !== hoy.getTime()) {
    return {
      ok: false,
      error: {
        codigo: "NO_RETROACTIVO",
        mensaje: "Solo podés cargar las visitas del día de hoy. Si te olvidaste un día anterior, pedile al administrador que lo cargue.",
      },
    };
  }

  const puntosSinCambio = cantidadSinCambio * PUNTOS_SIN_CAMBIO;
  const puntosConCambio = cantidadConCambio * PUNTOS_CON_CAMBIO;
  const puntosTotal = puntosSinCambio + puntosConCambio;
  const cicloInicio = inicioDeCiclo(fechaVisita);

  const registro = await prisma.registro.upsert({
    where: {
      usuarioId_fechaVisita: { usuarioId, fechaVisita },
    },
    update: {
      cantidadSinCambio,
      cantidadConCambio,
      puntosSinCambio,
      puntosConCambio,
      puntosTotal,
      cargadoPorId,
      cicloInicio,
    },
    create: {
      usuarioId,
      cargadoPorId,
      fechaVisita,
      cantidadSinCambio,
      cantidadConCambio,
      puntosSinCambio,
      puntosConCambio,
      puntosTotal,
      cicloInicio,
    },
  });

  return { ok: true, registro };
}

/** Suma de puntos de un técnico en un ciclo determinado (por defecto, el actual). */
export async function totalPuntosCiclo(usuarioId: string, cicloInicio: Date) {
  const resultado = await prisma.registro.aggregate({
    where: { usuarioId, cicloInicio },
    _sum: { puntosTotal: true },
  });
  return resultado._sum.puntosTotal ?? 0;
}

/** Registros de un técnico dentro de un ciclo, ordenados por fecha. */
export async function registrosDelCiclo(usuarioId: string, cicloInicio: Date) {
  return prisma.registro.findMany({
    where: { usuarioId, cicloInicio },
    orderBy: { fechaVisita: "asc" },
  });
}

/** El registro de un técnico para una fecha puntual (o null si no cargó nada ese día). */
export async function registroDeFecha(usuarioId: string, fecha: Date) {
  const fechaVisita = soloFecha(fecha);
  return prisma.registro.findUnique({
    where: { usuarioId_fechaVisita: { usuarioId, fechaVisita } },
  });
}

/**
 * Elimina un registro puntual. SOLO para el admin (se verifica el rol
 * en la ruta de la API, no acá) — sirve para corregir un registro mal
 * cargado por completo, en vez de tener que "pisarlo" con ceros.
 *
 * Nota: borrar un registro tiene el mismo efecto en puntos que dejarlo
 * en 0/0 (ambos suman 0 al total del ciclo) — la diferencia es que acá
 * no queda ninguna fila para ese día, en vez de una fila en cero. Se
 * deja como una acción explícita y separada de "corregir cantidades"
 * para que el admin elija la que tenga más sentido en cada caso.
 */
export async function eliminarRegistro(id: string) {
  return prisma.registro.delete({ where: { id } });
}

function soloFecha(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

export type PuntoSerieDia = {
  diaCiclo: number; // 1-based, contado desde el primer día del ciclo
  fecha: Date;
  visitas: number;
  puntos: number;
  visitasAcumuladas: number;
  puntosAcumulados: number;
};

type RegistroParcial = {
  fechaVisita: Date;
  cantidadSinCambio: number;
  cantidadConCambio: number;
  puntosTotal: number;
};

/**
 * Arma la serie día a día de `inicio` a `fin` (inclusive), completando con
 * ceros los días sin registro y acumulando cuando hay más de una fila para
 * la misma fecha (caso del agregado de equipo, donde varios técnicos
 * pueden tener registro el mismo día).
 */
function construirSerieDiaria(registros: RegistroParcial[], inicio: Date, fin: Date): PuntoSerieDia[] {
  const porFecha = new Map<string, { visitas: number; puntos: number }>();
  for (const r of registros) {
    const key = r.fechaVisita.toISOString().slice(0, 10);
    const previo = porFecha.get(key) ?? { visitas: 0, puntos: 0 };
    porFecha.set(key, {
      visitas: previo.visitas + r.cantidadSinCambio + r.cantidadConCambio,
      puntos: previo.puntos + r.puntosTotal,
    });
  }

  const dias: PuntoSerieDia[] = [];
  let visitasAcumuladas = 0;
  let puntosAcumulados = 0;
  const cursor = new Date(inicio);
  let diaCiclo = 1;

  while (cursor.getTime() <= fin.getTime()) {
    const key = cursor.toISOString().slice(0, 10);
    const datoDia = porFecha.get(key) ?? { visitas: 0, puntos: 0 };
    visitasAcumuladas += datoDia.visitas;
    puntosAcumulados += datoDia.puntos;
    dias.push({
      diaCiclo,
      fecha: new Date(cursor),
      visitas: datoDia.visitas,
      puntos: datoDia.puntos,
      visitasAcumuladas,
      puntosAcumulados,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    diaCiclo++;
  }

  return dias;
}

/** Serie diaria (acumulada) de UN técnico dentro de un ciclo, de `inicio` a `fin`. */
export async function serieDiariaCiclo(usuarioId: string, inicio: Date, fin: Date): Promise<PuntoSerieDia[]> {
  const registros = await prisma.registro.findMany({
    where: { usuarioId, cicloInicio: inicio },
    select: { fechaVisita: true, cantidadSinCambio: true, cantidadConCambio: true, puntosTotal: true },
  });
  return construirSerieDiaria(registros, inicio, fin);
}

/** Serie diaria (acumulada) de TODOS los técnicos combinados, dentro de un ciclo. */
export async function serieDiariaCicloEquipo(inicio: Date, fin: Date): Promise<PuntoSerieDia[]> {
  const registros = await prisma.registro.findMany({
    where: { cicloInicio: inicio },
    select: { fechaVisita: true, cantidadSinCambio: true, cantidadConCambio: true, puntosTotal: true },
  });
  return construirSerieDiaria(registros, inicio, fin);
}

export type PuntoComparativo = { diaCiclo: number; actual: number | null; anterior: number | null };

/**
 * Combina la serie del ciclo actual con la del ciclo anterior en un solo
 * arreglo indexado por "día del ciclo", para poder graficar las dos líneas
 * una contra la otra. El ciclo actual normalmente viene más corto (llega
 * solo hasta hoy), así que a partir de ahí queda en `null` — recharts corta
 * la línea ahí en vez de inventar una caída a cero.
 */
export function combinarSeriesComparativas(
  actual: PuntoSerieDia[],
  anterior: PuntoSerieDia[],
  metrica: "visitas" | "puntos"
): PuntoComparativo[] {
  const campo = metrica === "visitas" ? "visitasAcumuladas" : "puntosAcumulados";
  const porDiaActual = new Map(actual.map((d) => [d.diaCiclo, d[campo]]));
  const porDiaAnterior = new Map(anterior.map((d) => [d.diaCiclo, d[campo]]));
  const maxDias = Math.max(
    actual.length ? actual[actual.length - 1].diaCiclo : 0,
    anterior.length ? anterior[anterior.length - 1].diaCiclo : 0
  );

  const resultado: PuntoComparativo[] = [];
  for (let dia = 1; dia <= maxDias; dia++) {
    resultado.push({
      diaCiclo: dia,
      actual: porDiaActual.get(dia) ?? null,
      anterior: porDiaAnterior.get(dia) ?? null,
    });
  }
  return resultado;
}
