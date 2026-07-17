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
