import { NextRequest, NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// PATCH /api/usuarios/[id]  { activo: boolean }
//
// "Desactivar" es la opción normal para un técnico que se va o que ya
// no debería poder entrar: deja de poder entrar y desaparece de las
// listas activas, pero conserva su historial de puntos/comisión. El
// DELETE de más abajo es la otra opción, deliberadamente destructiva:
// borra a la persona Y todo lo que cargó, sin vuelta atrás.
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
// Elimina al técnico Y todo su historial (todos sus registros de
// visitas, sin importar el ciclo, más cualquier registro que haya
// cargado él mismo). Es intencionalmente destructivo y no se puede
// deshacer — para conservar el historial de alguien que se va, la
// opción correcta es "Desactivar" (PATCH de arriba), no esto.
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

  await prisma.$transaction([
    prisma.registro.deleteMany({ where: { OR: [{ usuarioId: params.id }, { cargadoPorId: params.id }] } }),
    prisma.pushSubscription.deleteMany({ where: { usuarioId: params.id } }),
    prisma.usuario.delete({ where: { id: params.id } }),
  ]);

  return NextResponse.json({ ok: true });
}
