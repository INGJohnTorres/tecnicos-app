import { NextRequest, NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { eliminarRegistro } from "@/lib/registros";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Solo el admin puede eliminar un registro — sirve para corregir un
// día mal cargado por completo (en vez de "pisarlo" con ceros desde
// la pantalla de carga).
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
  }
  if (usuario.rol !== "ADMIN") {
    return NextResponse.json({ error: "Solo el administrador puede eliminar registros" }, { status: 403 });
  }

  const registro = await prisma.registro.findUnique({ where: { id: params.id } });
  if (!registro) {
    return NextResponse.json({ error: "Ese registro no existe (¿ya lo habías borrado?)" }, { status: 404 });
  }

  await eliminarRegistro(params.id);
  return NextResponse.json({ ok: true });
}
