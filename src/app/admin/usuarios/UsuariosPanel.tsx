"use client";

import { useState, useEffect, useCallback } from "react";

type Usuario = {
  id: string;
  nombre: string;
  rol: "ADMIN" | "TECNICO";
  activo: boolean;
};

export default function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  const [nombreNuevo, setNombreNuevo] = useState("");
  const [claveNueva, setClaveNueva] = useState("");
  const [creando, setCreando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    setUsuarios(data.usuarios ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  async function crearTecnico(e: React.FormEvent) {
    e.preventDefault();
    setMensaje(null);
    setCreando(true);

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreNuevo, clave: claveNueva }),
    });
    const data = await res.json();
    setCreando(false);

    if (!res.ok) {
      setMensaje({ tipo: "error", texto: data.error ?? "No se pudo crear" });
      return;
    }

    setMensaje({ tipo: "ok", texto: `Técnico "${nombreNuevo}" creado. Va a tener que cambiar la clave al entrar por primera vez.` });
    setNombreNuevo("");
    setClaveNueva("");
    cargarUsuarios();
  }

  async function cambiarEstado(u: Usuario) {
    const accion = u.activo ? "desactivar" : "reactivar";
    const confirmado = window.confirm(
      u.activo
        ? `¿Desactivar a "${u.nombre}"? No va a poder entrar a la app, pero su historial de visitas queda intacto.`
        : `¿Reactivar a "${u.nombre}"? Va a poder volver a entrar con su clave anterior.`
    );
    if (!confirmado) return;

    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !u.activo }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMensaje({ tipo: "error", texto: data.error ?? `No se pudo ${accion}` });
      return;
    }

    cargarUsuarios();
  }

  return (
    <main style={styles.main}>
      <div style={styles.columna}>
        <a href="/admin" style={styles.link}>← Volver al panel</a>
        <h1 style={styles.titulo}>Usuarios</h1>
        <p style={styles.nota}>
          Un técnico desactivado no puede entrar a la app y desaparece de las
          listas activas, pero su historial de visitas y comisión queda
          guardado. No hay opción de "eliminar" de verdad, a propósito —
          borrar la cuenta borraría también su historial de puntos.
        </p>

        {mensaje && <p style={mensaje.tipo === "ok" ? styles.ok : styles.error}>{mensaje.texto}</p>}

        {cargando && <p style={styles.nota}>Cargando...</p>}

        {!cargando && (
          <div style={styles.lista}>
            {usuarios.map((u) => (
              <div key={u.id} style={styles.tarjeta}>
                <div>
                  <strong>{u.nombre}</strong>
                  <span style={styles.rol}> · {u.rol === "ADMIN" ? "Administrador" : "Técnico"}</span>
                  {!u.activo && <span style={styles.badgeInactivo}>Inactivo</span>}
                </div>
                {u.rol === "TECNICO" && (
                  <button
                    style={u.activo ? styles.botonRojo : styles.botonVerde}
                    onClick={() => cambiarEstado(u)}
                  >
                    {u.activo ? "Desactivar" : "Reactivar"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={crearTecnico} style={styles.form}>
          <h2 style={styles.subtitulo}>Crear técnico nuevo</h2>
          <label style={styles.label}>
            Usuario (login — minúsculas, sin espacios ni tildes)
            <input
              style={styles.input}
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="ej: mgomez"
              required
            />
          </label>
          <label style={styles.label}>
            Clave inicial (el técnico la va a tener que cambiar al entrar)
            <input
              style={styles.input}
              type="text"
              value={claveNueva}
              onChange={(e) => setClaveNueva(e.target.value)}
              placeholder="mínimo 6 caracteres"
              required
            />
          </label>
          <button style={styles.boton} disabled={creando}>
            {creando ? "Creando..." : "Crear técnico"}
          </button>
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 16,
    display: "flex",
    justifyContent: "center",
  },
  columna: { width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 12 },
  titulo: { margin: "8px 0 0", fontSize: 22 },
  subtitulo: { margin: "0 0 4px", fontSize: 16 },
  nota: { fontSize: 13, color: "#777", margin: 0 },
  lista: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8 },
  tarjeta: {
    background: "#fff", borderRadius: 10, padding: "12px 16px",
    display: "flex", justifyContent: "space-between", alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)", fontSize: 14,
  },
  rol: { color: "#888", fontSize: 13 },
  badgeInactivo: {
    marginLeft: 8, fontSize: 11, color: "#92400e", background: "#fffbeb",
    border: "1px solid #fde68a", borderRadius: 6, padding: "2px 6px",
  },
  botonRojo: { padding: "6px 12px", borderRadius: 8, border: "1px solid #f3b3b3", background: "#fff5f5", color: "#c0392b", fontSize: 13, cursor: "pointer" },
  botonVerde: { padding: "6px 12px", borderRadius: 8, border: "1px solid #b7e4c7", background: "#f0fdf4", color: "#15803d", fontSize: 13, cursor: "pointer" },
  form: {
    background: "#fff", borderRadius: 12, padding: 20, marginTop: 16,
    display: "flex", flexDirection: "column", gap: 12,
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13 },
  input: { padding: "10px 12px", borderRadius: 8, border: "1px solid #ccc", fontSize: 15 },
  boton: { padding: 12, borderRadius: 8, border: "none", background: "#111", color: "#fff", fontSize: 15, cursor: "pointer" },
  link: { fontSize: 13, color: "#2563eb", textDecoration: "none" },
  ok: { color: "#15803d", fontSize: 13, margin: 0 },
  error: { color: "#c0392b", fontSize: 13, margin: 0 },
};
