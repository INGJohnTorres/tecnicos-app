import { NextRequest, NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { guardarRegistroDelDia, registroDeFecha, registrosDelCiclo } from "@/lib/registros";
import { inicioDeCiclo, hoyBogota } from "@/lib/ciclo";

export const runtime = "nodejs";

/**
 * GET /api/registros                         -> mi registro de hoy (técnico)
 * GET /api/registros?fecha=YYYY-MM-DD         -> mi registro de esa fecha (propia)
 * GET /api/registros?usuarioId=X              -> (solo admin) todos los registros
 *                                                 del ciclo actual de ese técnico
 */
export async function GET(req: NextRequest) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
  }

  const usuarioIdParam = req.nextUrl.searchParams.get("usuarioId");
  const esAdmin = usuario.rol === "ADMIN";

  // Admin consultando el historial de un técnico dentro del ciclo actual.
  if (esAdmin && usuarioIdParam) {
    const { inicio } = { inicio: inicioDeCiclo(hoyBogota()) };
    const registros = await registrosDelCiclo(usuarioIdParam, inicio);
    return NextResponse.json({ registros });
  }

  // Consulta normal: "¿qué cargué yo tal día?" (por defecto, hoy).
  const fechaParam = req.nextUrl.searchParams.get("fecha");
  const fecha = fechaParam ? new Date(fechaParam) : hoyBogota();
  const registro = await registroDeFecha(usuario.id, fecha);
  return NextResponse.json({ registro });
}

export async function POST(req: NextRequest) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
  }

  const body = await req.json();
  const {
    usuarioId, // solo lo usa el admin, para cargar a nombre de otro
    fechaVisita,
    cantidadSinCambio,
    cantidadConCambio,
  } = body;

  const esAdmin = usuario.rol === "ADMIN";

  // Un técnico normal solo puede cargar sus propias visitas.
  const usuarioObjetivo = esAdmin && usuarioId ? usuarioId : usuario.id;

  if (!esAdmin && usuarioId && usuarioId !== usuario.id) {
    return NextResponse.json(
      { error: "No podés cargar visitas a nombre de otro usuario" },
      { status: 403 }
    );
  }

  if (!fechaVisita) {
    return NextResponse.json({ error: "Falta la fecha de la visita" }, { status: 400 });
  }

  const resultado = await guardarRegistroDelDia({
    usuarioId: usuarioObjetivo,
    cargadoPorId: usuario.id,
    esAdmin,
    fechaVisita: new Date(fechaVisita),
    cantidadSinCambio: Number(cantidadSinCambio ?? 0),
    cantidadConCambio: Number(cantidadConCambio ?? 0),
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error.mensaje, codigo: resultado.error.codigo }, { status: 400 });
  }

  return NextResponse.json({ ok: true, registro: resultado.registro });
}
