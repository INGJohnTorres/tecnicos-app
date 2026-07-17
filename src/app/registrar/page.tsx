"use client";

import { useState, useEffect } from "react";
import { hoyBogotaISO } from "@/lib/ciclo";

export default function RegistrarPage() {
  const [cantidadSinCambio, setCantidadSinCambio] = useState(0);
  const [cantidadConCambio, setCantidadConCambio] = useState(0);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [yaHabiaCargado, setYaHabiaCargado] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  // OJO: se calcula con la hora de Bogotá (fija UTC-5), no con
  // `toISOString()` del navegador — ese devuelve la fecha en UTC, que
  // entre las 19:00 y las 23:59 hora Colombia ya está un día adelantado.
  const hoyISO = hoyBogotaISO();
  const puntosPreview = cantidadSinCambio * 76 + cantidadConCambio * 66;

  // Si el técnico ya cargó algo hoy y vuelve a entrar, precargamos lo
  // que ya había puesto — así puede corregirlo con lo que ve, en vez
  // de arriesgarse a machacarlo sin darse cuenta con un formulario en cero.
  useEffect(() => {
    fetch("/api/registros")
      .then((r) => r.json())
      .then((data) => {
        if (data.registro) {
          setCantidadSinCambio(data.registro.cantidadSinCambio);
          setCantidadConCambio(data.registro.cantidadConCambio);
          setYaHabiaCargado(true);
        }
      })
      .finally(() => setCargandoInicial(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setGuardando(true);

    const res = await fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fechaVisita: hoyISO,
        cantidadSinCambio,
        cantidadConCambio,
      }),
    });

    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setMensaje({ tipo: "error", texto: data.error ?? "No se pudo guardar" });
      return;
    }

    setYaHabiaCargado(true);
    setMensaje({ tipo: "ok", texto: `Guardado: ${puntosPreview} puntos para hoy (${hoyISO}).` });
  }

  return (
    <main style={styles.main}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.titulo}>Visitas de hoy</h1>
        <p style={styles.fecha}>{hoyISO}</p>

        {!cargandoInicial && yaHabiaCargado && (
          <p style={styles.aviso}>
            Ya habías cargado hoy — esto es lo que tenías guardado. Podés
            corregirlo y volver a guardar mientras siga siendo el mismo día.
          </p>
        )}

        <label style={styles.label}>
          Visitas SIN cambio de equipo (76 pts c/u)
          <input
            style={styles.input}
            type="number"
            min={0}
            value={cantidadSinCambio}
            onChange={(e) => setCantidadSinCambio(Math.max(0, Number(e.target.value)))}
          />
        </label>

        <label style={styles.label}>
          Visitas CON cambio de equipo (66 pts c/u)
          <input
            style={styles.input}
            type="number"
            min={0}
            value={cantidadConCambio}
            onChange={(e) => setCantidadConCambio(Math.max(0, Number(e.target.value)))}
          />
        </label>

        <p style={styles.preview}>Total del día: <strong>{puntosPreview} puntos</strong></p>

        {mensaje && (
          <p style={mensaje.tipo === "ok" ? styles.ok : styles.error}>{mensaje.texto}</p>
        )}

        <button style={styles.boton} disabled={guardando || cargandoInicial}>
          {guardando ? "Guardando..." : yaHabiaCargado ? "Corregir visitas de hoy" : "Guardar visitas de hoy"}
        </button>

        <a href="/mi-ciclo" style={styles.link}>Ver mi ciclo actual →</a>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 16,
  },
  form: {
    background: "#fff",
    padding: 32,
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
    maxWidth: 420,
  },
  titulo: { margin: 0, fontSize: 22 },
  fecha: { margin: 0, color: "#777", fontSize: 14 },
  aviso: {
    margin: 0,
    fontSize: 13,
    color: "#92400e",
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 8,
    padding: "8px 10px",
  },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 14 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  preview: { margin: 0, fontSize: 15 },
  boton: {
    padding: "12px",
    borderRadius: 8,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
  },
  link: { textAlign: "center", fontSize: 14, color: "#2563eb" },
  ok: { color: "#15803d", fontSize: 14, margin: 0 },
  error: { color: "#c0392b", fontSize: 14, margin: 0 },
};
