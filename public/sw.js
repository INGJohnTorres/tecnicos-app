// Service worker: recibe la notificación push del servidor y la muestra,
// aunque la app esté cerrada. Esto es lo que hace posible el recordatorio
// de las 8pm sin que el técnico tenga la app abierta.

self.addEventListener("push", (event) => {
  let datos = { titulo: "Recordatorio", cuerpo: "Tenés una notificación pendiente.", url: "/" };
  try {
    datos = event.data.json();
  } catch (e) {
    // si no viene como JSON, usamos los valores por defecto de arriba
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: "/icon-192.png",
      data: { url: datos.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"));
});
