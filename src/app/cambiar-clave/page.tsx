"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CambiarClavePage() {
  const router = useRouter();
  const [claveNueva, setClaveNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (claveNueva !== confirmar) {
      setError("Las dos claves no coinciden");
      return;
    }

    setCargando(true);
    const res = await fetch("/api/auth/cambiar-clave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claveNueva }),
    });
    const data = await res.json();
    setCargando(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo cambiar la clave");
      return;
    }

    router.push("/login");
  }

  return (
    <main style={styles.main}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.titulo}>Cambiá tu clave</h1>
        <p style={styles.texto}>
          Es tu primer ingreso — elegí una clave nueva antes de continuar.
        </p>

        <label style={styles.label}>
          Clave nueva
          <input
            style={styles.input}
            type="password"
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
            minLength={6}
            required
            autoFocus
          />
        </label>

        <label style={styles.label}>
          Confirmar clave
          <input
            style={styles.input}
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.boton} disabled={cargando}>
          {cargando ? "Guardando..." : "Guardar y continuar"}
        </button>
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
    maxWidth: 360,
  },
  titulo: { margin: 0, fontSize: 22 },
  texto: { margin: 0, fontSize: 14, color: "#555" },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 14 },
  input: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  boton: {
    padding: "12px",
    borderRadius: 8,
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
  },
  error: { color: "#c0392b", fontSize: 14, margin: 0 },
};
