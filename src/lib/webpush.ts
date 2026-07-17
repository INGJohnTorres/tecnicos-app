import webpush from "web-push";

let vapidConfigurado = false;

function asegurarVapidConfigurado() {
  if (vapidConfigurado) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en las variables de entorno."
    );
  }

  webpush.setVapidDetails("mailto:admin@example.com", publicKey, privateKey);
  vapidConfigurado = true;
}

export { webpush };

export type PushPayload = { titulo: string; cuerpo: string; url?: string };

export async function enviarPush(
  suscripcion: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  try {
    asegurarVapidConfigurado();
    await webpush.sendNotification(
      {
        endpoint: suscripcion.endpoint,
        keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (err) {
    return false;
  }
}