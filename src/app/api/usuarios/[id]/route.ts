import { NextRequest, NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// PATCH /api/usuarios/[id]  { activo: boolean }
//
// No hay un DELETE real a propósito: los registros de visitas quedan
// atados al usuario (para conservar el historial de puntos/comisión),
// así que borrar la fila de verdad rompería esas referencias o
// arrastraría el historial con ella. "Desactivar" logra el mismo
// resultado práctico (deja de poder entrar, desaparece de las listas
// activas) sin perder nada.
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
