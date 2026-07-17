import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SECRETO = process.env.JWT_SECRET!;
const NOMBRE_COOKIE = "sesion";
const DURACION = "12h";

type PayloadSesion = { sub: string; rol: "ADMIN" | "TECNICO" };

export function firmarSesion(usuarioId: string, rol: "ADMIN" | "TECNICO") {
  return jwt.sign({ sub: usuarioId, rol } as PayloadSesion, SECRETO, {
    expiresIn: DURACION,
  });
}

export function verificarSesion(token: string): PayloadSesion | null {
  try {
    return jwt.verify(token, SECRETO) as PayloadSesion;
  } catch {
    return null;
  }
}

/** Para usar dentro de Server Components y Route Handlers (runtime Node). */
export async function usuarioActual() {
  const token = cookies().get(NOMBRE_COOKIE)?.value;
  if (!token) return null;

  const payload = verificarSesion(token);
  if (!payload) return null;

  const usuario = await prisma.usuario.findUnique({ where: { id: payload.sub } });
  if (!usuario || !usuario.activo) return null;

  return usuario;
}

export const COOKIE_SESION = NOMBRE_COOKIE;
