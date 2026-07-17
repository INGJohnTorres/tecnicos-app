"use client";

import { useState, useEffect, useCallback } from "react";
import { hoyBogotaISO } from "@/lib/ciclo";

type Tecnico = { id: string; nombre: string };
type Registro = {
  id: string;
  fechaVisita: string;
  cantidadSinCambio: number;
  cantidadConCambio: number;
  puntosTotal: number;
  cargadoPorId: string;
};

export default function CargarVisitaForm({ tecnicos }: { tecnicos: Tecnico[] }) {
  const [usuarioId, setUsuarioId] = useState(tecnicos[0]?.id ?? "");
  // Se precarga con hoy (hora Bogotá) por comodidad, pero el admin puede
  // elegir cualquier fecha anterior — para eso es esta pantalla.
  const [fechaVisita, setFechaVisita] = useState(hoyBogotaISO());
  const [cantidadSinCambio, setCantidadSinCambio] = useState(0);
  const [cantidadConCambio, setCantidadConCambio] = useState(0);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargandoLista, setCargandoLista] = useState(false);

  const cargarRegistros = useCallback(async (id: string) => {
    if (!id) return;
    setCargandoLista(true);
    const res = await fetch(`/api/registros?usuarioId=${id}`);
    const data = await res.json();
    setRegistros(data.registros ?? []);
    setCargandoLista(false);
  }, []);

  // Cada vez que se cambia de técnico, traemos su historial del ciclo actual.
  useEffect(() => {
    cargarRegistros(usuarioId);
  }, [usuarioId, cargarRegistros]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setGuardando(true);

    const res = await fetch("/api/registros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId, fechaVisita, cantidadSinCambio, cantidadConCambio }),
    });

    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setMensaje({ tipo: "error", texto: data.error ?? "No se pudo guardar" });
      return;
    }

    setMensaje({ tipo: "ok", texto: "Guardado (queda registrado que lo cargaste vos, no el técnico)." });
    cargarRegistros(usuarioId);
  }

  function editar(r: Registro) {
    setFechaVisita(r.fechaVisita.slice(0, 10));
    setCantidadSinCambio(r.cantidadSinCambio);
    setCantidadConCambio(r.cantidadConCambio);
    setMensaje(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminar(r: Registro) {
    const confirmado = window.confirm(
      `¿Eliminar el registro del ${r.fechaVisita.slice(0, 10)} (${r.puntosTotal} puntos)? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    const res = await fetch(`/api/registros/${r.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setMensaje({ tipo: "error", texto: data.error ?? "No se pudo eliminar" });
      return;
    }

    setMensaje({ tipo: "ok", texto: "Registro eliminado." });
    cargarRegistros(usuarioId);
  }

  return (
    <main style={styles.main}>
      <div style={styles.columna}>
        <form onSubmit={handleSubmit} style={styles.form}>
          <h1 style={styles.titulo}>Cargar / corregir visita de un técnico</h1>
          <p style={styles.nota}>
            Esto queda registrado como cargado por el administrador, no por el técnico.
            Si el técnico ya tenía algo cargado ese día, esto lo reemplaza.
          </p>

          <label style={styles.label}>
            Técnico
            <select style={styles.input} value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Fecha de la visita
            <input
              style={styles.input}
              type="date"
              value={fechaVisita}
              onChange={(e) => setFechaVisita(e.target.value)}
            />
          </label>

          <label style={styles.label}>
            Visitas SIN cambio (76 pts c/u)
            <input
              style={styles.input}
              type="number"
              min={0}
              value={cantidadSinCambio}
              onChange={(e) => setCantidadSinCambio(Math.max(0, Number(e.target.value)))}
            />
          </label>

          <label style={styles.label}>
            Visitas CON cambio (66 pts c/u)
            <input
              style={styles.input}
              type="number"
              min={0}
              value={cantidadConCambio}
              onChange={(e) => setCantidadConCambio(Math.max(0, Number(e.target.value)))}
            />
          </label>

          {mensaje && <p style={mensaje.tipo === "ok" ? styles.ok : styles.error}>{mensaje.texto}</p>}

          <button style={styles.boton} disabled={guardando || !usuarioId}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>

          <a href="/admin" style={styles.link}>← Volver al panel</a>
        </form>

        <div style={styles.historial}>
          <h2 style={styles.subtitulo}>Registros del ciclo actual</h2>
          {cargandoLista && <p style={styles.nota}>Cargando...</p>}
          {!cargandoLista && registros.length === 0 && (
            <p style={styles.nota}>Este técnico todavía no cargó nada en el ciclo actual.</p>
          )}
          {!cargandoLista && registros.length > 0 && (
            <table style={styles.tabla}>
              <thead>
                <tr>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Sin cambio</th>
                  <th style={styles.th}>Con cambio</th>
                  <th style={styles.th}>Puntos</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {registros.map((r) => (
                  <tr key={r.id}>
                    <td style={styles.td}>{r.fechaVisita.slice(0, 10)}</td>
                    <td style={styles.td}>{r.cantidadSinCambio}</td>
                    <td style={styles.td}>{r.cantidadConCambio}</td>
                    <td style={styles.td}>{r.puntosTotal}</td>
                    <td style={{ ...styles.td, display: "flex", gap: 6 }}>
                      <button style={styles.botonChico} onClick={() => editar(r)}>Editar</button>
                      <button style={styles.botonChicoRojo} onClick={() => eliminar(r)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 16,
  },
  columna: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: "100%",
    maxWidth: 480,
  },
  form: {
    background: "#fff",
    padding: 32,
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  historial: {
    background: "#fff",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  titulo: { margin: 0, fontSize: 20 },
  subtitulo: { margin: "0 0 12px 0", fontSize: 16 },
  nota: { margin: 0, fontSize: 13, color: "#777" },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 14 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 16 },
  boton: { padding: 12, borderRadius: 8, border: "none", background: "#111", color: "#fff", fontSize: 16, cursor: "pointer" },
  botonChico: {
    padding: "4px 10px", borderRadius: 6, border: "1px solid #ccc",
    background: "#fff", fontSize: 12, cursor: "pointer",
  },
  botonChicoRojo: {
    padding: "4px 10px", borderRadius: 6, border: "1px solid #f3b3b3",
    background: "#fff5f5", color: "#c0392b", fontSize: 12, cursor: "pointer",
  },
  link: { textAlign: "center", fontSize: 14, color: "#2563eb" },
  ok: { color: "#15803d", fontSize: 14, margin: 0 },
  error: { color: "#c0392b", fontSize: 14, margin: 0 },
  tabla: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", borderBottom: "1px solid #eee", padding: "6px 4px", color: "#777", fontWeight: 500 },
  td: { borderBottom: "1px solid #f3f3f3", padding: "6px 4px" },
};
