import webpush from "web-push";

// Las VAPID keys identifican a TU app frente a los servidores push de
// Google/Android — se generan una sola vez (ver README) y son gratis.
webpush.setVapidDetails(
  "mailto:admin@example.com", // se puede dejar así, no hace falta que sea real
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export { webpush };

export type PushPayload = { titulo: string; cuerpo: string; url?: string };

export async function enviarPush(
  suscripcion: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    await webpush.sendNotification(
      {
        endpoint: suscripcion.endpoint,
        keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    // 410/404 = la suscripción ya no es válida (el técnico desinstaló, etc.)
    // No es un error grave, solo hay que limpiarla — se maneja donde se llama a esta función.
    return false;
  }
}
