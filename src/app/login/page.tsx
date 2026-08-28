"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, clave }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        setError(`Error del servidor (código ${res.status}). Avisale al admin.`);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión");
        return;
      }

      if (data.usuario.requiereCambioClave) {
        router.push("/cambiar-clave");
        return;
      }

      router.push(data.usuario.rol === "ADMIN" ? "/admin" : "/mi-ciclo");
    } catch (err) {
      setError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main style={styles.main}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h1 style={styles.titulo}>Ingresar</h1>

        <label style={styles.label}>
          Nombre
          <input
            style={styles.input}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            autoFocus
            required
          />
        </label>

        <label style={styles.label}>
          Clave
          <input
            style={styles.input}
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.boton} disabled={cargando}>
          {cargando ? "Ingresando..." : "Ingresar"}
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
