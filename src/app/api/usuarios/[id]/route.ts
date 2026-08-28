import { NextRequest, NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// PATCH /api/usuarios/[id]  { activo: boolean }
//
// Para un técnico que YA tiene historial no hay un DELETE real a
// propósito: los registros de visitas quedan atados al usuario (para
// conservar el historial de puntos/comisión), así que borrar la fila
// de verdad arrastraría ese historial con ella. "Desactivar" logra el
// mismo resultado práctico (deja de poder entrar, desaparece de las
// listas activas) sin perder nada. El DELETE de más abajo solo cubre
// el caso de un técnico recién creado por error, sin visitas todavía.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
  }
  if (usuario.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede hacer esto" }, { status: 403 });
  }

  if (params.id === usuario.id) {
    return NextResponse.json(
      { error: "No podés desactivar tu propia cuenta de administrador" },
      { status: 400 }
    );
  }

  const { activo } = await req.json();
  if (typeof activo !== "boolean") {
    return NextResponse.json({ error: "Falta el campo 'activo' (true/false)" }, { status: 400 });
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id: params.id } });
  if (!objetivo) {
    return NextResponse.json({ error: "Ese usuario no existe" }, { status: 404 });
  }

  const actualizado = await prisma.usuario.update({
    where: { id: params.id },
    data: { activo },
    select: { id: true, nombre: true, rol: true, activo: true },
  });

  return NextResponse.json({ ok: true, usuario: actualizado });
}

// DELETE /api/usuarios/[id]
//
// Complementa el "no hay eliminar de verdad" de arriba: sirve puntualmente
// para el caso de "creé un técnico por error" — solo se permite borrar de
// verdad cuando esa persona todavía no tiene NINGUNA visita cargada (ni a
// su nombre ni cargada por ella). Si ya tiene historial, se rechaza y se
// indica usar "Desactivar" para no perder puntos/comisión.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
  }
  if (usuario.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede hacer esto" }, { status: 403 });
  }
  if (params.id === usuario.id) {
    return NextResponse.json({ error: "No podés eliminar tu propia cuenta" }, { status: 400 });
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id: params.id } });
  if (!objetivo) {
    return NextResponse.json({ error: "Ese usuario no existe" }, { status: 404 });
  }
  if (objetivo.rol === "ADMIN") {
    return NextResponse.json({ error: "No se puede eliminar una cuenta de administrador" }, { status: 400 });
  }

  const tieneHistorial = await prisma.registro.findFirst({
    where: { OR: [{ usuarioId: params.id }, { cargadoPorId: params.id }] },
    select: { id: true },
  });
  if (tieneHistorial) {
    return NextResponse.json(
      {
        error: `"${objetivo.nombre}" ya tiene visitas cargadas — eliminarlo borraría ese historial de puntos. Usá "Desactivar" en su lugar.`,
        codigo: "TIENE_HISTORIAL",
      },
      { status: 409 }
    );
  }

  try {
    await prisma.pushSubscription.deleteMany({ where: { usuarioId: params.id } });
    await prisma.usuario.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar (puede que se haya cargado una visita justo ahora). Probá de nuevo o usá 'Desactivar'." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true });
}
