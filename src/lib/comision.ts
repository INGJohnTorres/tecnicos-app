import { prisma } from "./prisma";

export type ResultadoComision =
  | { estado: "bajo_minimo"; minimoRequerido: number }
  | { estado: "ok"; comision: number; produccionEstimada: number }
  | { estado: "tope_maximo"; comision: number; produccionEstimada: number };

/**
 * Traduce un total de puntos acumulados en el ciclo a la
 * "productividad estimada", usando la tabla oficial FTTH.
 *
 * Esta es la misma lógica que ya validamos con el script
 * `validar_comision.py` contra 10 técnicos reales de la planilla de
 * nómina (10/10 aciertos) — acá vive como parte de la app, consultando
 * la tabla ya cargada en la base de datos en vez del Excel.
 *
 * OJO: esto es una ESTIMACIÓN. El valor final de nómina puede diferir
 * por ajustes de calidad, ausentismo o bonos que la empresa aplica
 * por fuera de esta app.
 */
export async function calcularProductividadEstimada(
  puntosTotales: number
): Promise<ResultadoComision> {
  if (puntosTotales <= 0) {
    const minimo = await prisma.tablaComisionFTTH.findFirst({
      orderBy: { puntos: "asc" },
    });
    return { estado: "bajo_minimo", minimoRequerido: minimo?.puntos ?? 0 };
  }

  // La tabla trae una fila por cada entero de puntos, así que la
  // búsqueda es una igualdad exacta, no una interpolación.
  const fila = await prisma.tablaComisionFTTH.findUnique({
    where: { puntos: puntosTotales },
  });

  if (fila) {
    return {
      estado: "ok",
      comision: fila.comision,
      produccionEstimada: fila.produccion,
    };
  }

  const primero = await prisma.tablaComisionFTTH.findFirst({
    orderBy: { puntos: "asc" },
  });
  const ultimo = await prisma.tablaComisionFTTH.findFirst({
    orderBy: { puntos: "desc" },
  });

  if (primero && puntosTotales < primero.puntos) {
    return { estado: "bajo_minimo", minimoRequerido: primero.puntos };
  }

  if (ultimo && puntosTotales > ultimo.puntos) {
    return {
      estado: "tope_maximo",
      comision: ultimo.comision,
      produccionEstimada: ultimo.produccion,
    };
  }

  // No debería pasar (la tabla es consecutiva), pero por las dudas:
  // buscamos el entero más cercano hacia abajo.
  const aproximado = await prisma.tablaComisionFTTH.findFirst({
    where: { puntos: { lte: puntosTotales } },
    orderBy: { puntos: "desc" },
  });

  return {
    estado: "ok",
    comision: aproximado?.comision ?? 0,
    produccionEstimada: aproximado?.produccion ?? 0,
  };
}

/**
 * Cuántos puntos faltan para llegar al siguiente tramo de comisión.
 * Útil para la pantalla "Mi ciclo": "te faltan 89 puntos para subir de tramo".
 */
export async function puntosParaSiguienteTramo(
  puntosTotales: number
): Promise<{ puntosFaltantes: number; siguienteComision: number } | null> {
  const siguiente = await prisma.tablaComisionFTTH.findFirst({
    where: { puntos: { gt: puntosTotales } },
    orderBy: { puntos: "asc" },
  });

  if (!siguiente) return null; // ya está en el tope de la tabla

  return {
    puntosFaltantes: siguiente.puntos - puntosTotales,
    siguienteComision: siguiente.comision,
  };
}
