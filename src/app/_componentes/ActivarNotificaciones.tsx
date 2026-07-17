"use client";

import { useEffect, useState } from "react";

export default function ActivarNotificaciones() {
  const [estado, setEstado] = useState<"inicial" | "activando" | "activo" | "error" | "no_soportado">("inicial");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("no_soportado");
      return;
    }
    // Si ya hay una suscripción activa, lo mostramos directamente.
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const sub = await reg?.pushManager.getSubscription();
      if (sub) setEstado("activo");
    });
  }, []);

  async function activar() {
    setEstado("activando");
    try {
      const registro = await navigator.serviceWorker.register("/sw.js");
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado("error");
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(suscripcion),
      });

      setEstado("activo");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "no_soportado") return null; // no molestamos si el navegador no soporta push
  if (estado === "activo") {
    return <p style={{ fontSize: 12, color: "#15803d" }}>🔔 Recordatorios activados</p>;
  }

  return (
    <button onClick={activar} disabled={estado === "activando"} style={styles.boton}>
      {estado === "activando" ? "Activando..." : "🔔 Activar recordatorio diario"}
    </button>
  );
}

// Las claves VAPID vienen en base64url — el navegador necesita un Uint8Array.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const styles: Record<string, React.CSSProperties> = {
  boton: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    cursor: "pointer",
    color: "#1d4ed8",
  },
};
