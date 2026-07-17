import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarPush } from "@/lib/webpush";
import { hoyBogota } from "@/lib/ciclo";

export const runtime = "nodejs";

/**
 * Se llama todos los días a las 8pm (hora Colombia) vía Vercel Cron
 * (ver vercel.json). Busca a los técnicos que NO cargaron su registro
 * de hoy y les manda un recordatorio push.
 *
 * Protegido con CRON_SECRET para que no cualquiera pueda dispararlo.
 *
 * OJO con la fecha: a las 8pm hora Colombia, en UTC ya es la 1am del
 * día siguiente. Por eso usamos `hoyBogota()` en vez de la fecha UTC
 * cruda del servidor — si no, el cron siempre estaría preguntando por
 * las visitas de "mañana" en vez de las de hoy.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoyFecha = hoyBogota();

  const tecnicos = await prisma.usuario.findMany({
    where: { rol: "TECNICO", activo: true },
    include: {
      suscripcionesPush: true,
      visitas: { where: { fechaVisita: hoyFecha }, select: { id: true } },
    },
  });

  const pendientes = tecnicos.filter((t) => t.visitas.length === 0);

  let enviados = 0;
  for (const tecnico of pendientes) {
    for (const sub of tecnico.suscripcionesPush) {
      const ok = await enviarPush(sub, {
        titulo: "Recordatorio de visitas",
        cuerpo: "Todavía no cargaste tus visitas de hoy. Cargalas antes de que cierre el día.",
        url: "/registrar",
      });
      if (ok) enviados++;
      else {
        // Suscripción vencida/inválida: la borramos para no seguir intentando en vano.
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    ok: true,
    tecnicosPendientes: pendientes.length,
    notificacionesEnviadas: enviados,
  });
}
