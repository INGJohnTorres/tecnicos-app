import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { firmarSesion, COOKIE_SESION } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { nombre, clave } = await req.json();

    if (!nombre || !clave) {
      return NextResponse.json(
        { error: "Falta nombre o clave" },
        { status: 400 }
      );
    }

    const usuario = await prisma.usuario.findUnique({ where: { nombre } });

    if (!usuario || !usuario.activo) {
      return NextResponse.json(
        { error: "Nombre o clave incorrectos" },
        { status: 401 }
      );
    }

    const claveValida = await bcrypt.compare(clave, usuario.claveHash);
    if (!claveValida) {
      return NextResponse.json(
        { error: "Nombre o clave incorrectos" },
        { status: 401 }
      );
    }

    const token = firmarSesion(usuario.id, usuario.rol);

    const res = NextResponse.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        requiereCambioClave: usuario.requiereCambioClave,
      },
    });

    res.cookies.set(COOKIE_SESION, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return res;
  } catch (err) {
    console.error("Error en /api/auth/login:", err);
    return NextResponse.json(
      { error: "Error interno del servidor. Si persiste, revisá la conexión a la base de datos." },
      { status: 500 }
    );
  }
}
