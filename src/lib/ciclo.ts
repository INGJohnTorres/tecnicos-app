import { CICLO_DIA_INICIO } from "./config";

// Colombia está fija en UTC-5 todo el año (no tiene horario de verano).
// IMPORTANTE: los servidores (Vercel, la mayoría de hostings) corren en
// UTC. Si acá se usara `new Date()` / `getUTCDate()` directo, entre las
// 19:00 y las 23:59 hora Bogotá el reloj UTC ya está en el día siguiente
// — y justo esa ventana es donde más importa no equivocarse, porque el
// cierre del ciclo es a las 00:00 del día 19 *hora Bogotá*, no UTC.
const OFFSET_BOGOTA_MS = -5 * 60 * 60 * 1000;

/**
 * Devuelve un Date cuyos componentes UTC (getUTCDate, getUTCMonth, etc.)
 * representan la hora de pared de Bogotá en este momento — sin importar
 * en qué zona horaria esté corriendo el servidor.
 */
export function ahoraEnBogota(): Date {
  return new Date(Date.now() + OFFSET_BOGOTA_MS);
}

/**
 * Dada una fecha cualquiera, devuelve el primer día del ciclo de
 * facturación al que pertenece (siempre un día 19).
 *
 * Ejemplos (con CICLO_DIA_INICIO = 19):
 *   5  de julio 2026  -> 19 de junio 2026   (todavía en el ciclo anterior)
 *   19 de julio 2026  -> 19 de julio 2026   (el ciclo arranca justo hoy)
 *   18 de agosto 2026 -> 19 de julio 2026   (último día del ciclo)
 *
 * `fecha` tiene que venir ya representando el día de Bogotá (ver
 * `ahoraEnBogota` / `hoyBogotaISO`) — esta función solo lee sus
 * componentes UTC, no vuelve a convertir zona horaria.
 */
export function inicioDeCiclo(fecha: Date): Date {
  const dia = fecha.getUTCDate();
  const mes = fecha.getUTCMonth();
  const anio = fecha.getUTCFullYear();

  if (dia >= CICLO_DIA_INICIO) {
    return new Date(Date.UTC(anio, mes, CICLO_DIA_INICIO));
  }
  // Todavía no llegamos al día 19 de este mes -> el ciclo empezó el mes anterior.
  return new Date(Date.UTC(anio, mes - 1, CICLO_DIA_INICIO));
}

/** Último día (18) del ciclo que arranca en `inicio`. */
export function finDeCiclo(inicio: Date): Date {
  const fin = new Date(inicio);
  fin.setUTCMonth(fin.getUTCMonth() + 1);
  fin.setUTCDate(CICLO_DIA_INICIO - 1);
  return fin;
}

/** Ciclo actual, calculado a partir del día de hoy en hora de Bogotá. */
export function cicloActual(): { inicio: Date; fin: Date } {
  const inicio = inicioDeCiclo(ahoraEnBogota());
  return { inicio, fin: finDeCiclo(inicio) };
}

/** "Hoy" en Bogotá, como fecha pura (sin hora) — para comparar con fechaVisita. */
export function hoyBogota(): Date {
  const ahora = ahoraEnBogota();
  return new Date(
    Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate())
  );
}

/** "Hoy" en Bogotá, como string "YYYY-MM-DD" — para precargar el formulario. */
export function hoyBogotaISO(): string {
  const ahora = ahoraEnBogota();
  const yyyy = ahora.getUTCFullYear();
  const mm = String(ahora.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(ahora.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
