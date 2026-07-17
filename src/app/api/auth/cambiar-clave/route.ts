import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { usuarioActual } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
  }

  const { claveNueva } = await req.json();
  if (!claveNueva || claveNueva.length < 6) {
    return NextResponse.json(
      { error: "La clave nueva tiene que tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const claveHash = await bcrypt.hash(claveNueva, 10);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { claveHash, requiereCambioClave: false },
  });

  return NextResponse.json({ ok: true });
}
