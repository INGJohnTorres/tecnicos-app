import { NextRequest, NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "No hay sesión activa" }, { status: 401 });
  }

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { usuarioId: usuario.id, p256dh: keys.p256dh, auth: keys.auth },
    create: { usuarioId: usuario.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true });
}
