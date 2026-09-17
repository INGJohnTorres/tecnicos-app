"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/app/_componentes/ui/Field";
import Button from "@/app/_componentes/ui/Button";
import { IconZap, IconUser, IconLock, IconAlertTriangle } from "@/app/_componentes/ui/Icons";

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
    <main className="page-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card card-glow enter" style={{ width: "100%", maxWidth: 400, padding: "40px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconZap size={20} style={{ color: "white" }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5 }}>FTTH VISITAS</div>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", margin: "0 0 6px", fontSize: 23, fontWeight: 700, letterSpacing: "-.01em" }}>
          Acceso al sistema
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 13.5, color: "var(--text-muted)" }}>
          Ingresá tus credenciales para ver tu ciclo.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ position: "relative" }}>
            <Field
              label="Usuario"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoFocus
              required
              style={{ paddingLeft: 40 }}
            />
            <IconUser size={16} style={{ position: "absolute", left: 14, top: 38, color: "var(--text-faint)" }} />
          </div>

          <div style={{ position: "relative" }}>
            <Field
              label="Clave"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              style={{ paddingLeft: 40 }}
            />
            <IconLock size={16} style={{ position: "absolute", left: 14, top: 38, color: "var(--text-faint)" }} />
          </div>

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--danger)" }}>
              <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <Button type="submit" loading={cargando} style={{ marginTop: 6, width: "100%" }}>
            Ingresar
          </Button>
        </form>

        <p style={{ margin: "24px 0 0", textAlign: "center", fontSize: 12, color: "var(--text-faint)" }}>
          ¿Olvidaste tu clave? Contactá al administrador.
        </p>
      </div>
    </main>
  );
}
