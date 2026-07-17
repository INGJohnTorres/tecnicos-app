import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function requireAdmin() {
  const usuario = await usuarioActual();
  if (!usuario) return { error: NextResponse.json({ error: "No hay sesión activa" }, { status: 401 }) };
  if (usuario.rol !== "ADMIN") return { error: NextResponse.json({ error: "Solo el administrador puede hacer esto" }, { status: 403 }) };
  return { usuario };
}

// GET /api/usuarios -> lista de todos los usuarios (para el panel admin)
export async function GET() {
  const chequeo = await requireAdmin();
  if (chequeo.error) return chequeo.error;

  const usuarios = await prisma.usuario.findMany({
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, rol: true, activo: true, creadoEn: true },
  });
  return NextResponse.json({ usuarios });
}

// POST /api/usuarios -> crear un técnico nuevo
export async function POST(req: NextRequest) {
  const chequeo = await requireAdmin();
  if (chequeo.error) return chequeo.error;

  const { nombre, clave } = await req.json();

  if (!nombre || !clave) {
    return NextResponse.json({ error: "Falta nombre o clave" }, { status: 400 });
  }
  if (!/^[a-z0-9_]+$/.test(nombre)) {
    return NextResponse.json(
      { error: "El nombre de usuario solo puede tener minúsculas, números y guión bajo (sin espacios ni tildes)" },
      { status: 400 }
    );
  }
  if (clave.length < 6) {
    return NextResponse.json({ error: "La clave tiene que tener al menos 6 caracteres" }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { nombre } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe un usuario con ese nombre" }, { status: 409 });
  }

  const claveHash = await bcrypt.hash(clave, 10);
  const nuevo = await prisma.usuario.create({
    data: { nombre, claveHash, rol: "TECNICO" },
    select: { id: true, nombre: true, rol: true, activo: true },
  });

  return NextResponse.json({ ok: true, usuario: nuevo });
}
