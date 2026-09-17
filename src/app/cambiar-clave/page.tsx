"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/app/_componentes/ui/Field";
import Button from "@/app/_componentes/ui/Button";
import { IconZap, IconAlertTriangle } from "@/app/_componentes/ui/Icons";

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
    <main className="page-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card card-glow enter" style={{ width: "100%", maxWidth: 400, padding: "40px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--grad)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconZap size={20} style={{ color: "white" }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15.5 }}>FTTH VISITAS</div>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", margin: "0 0 6px", fontSize: 22, fontWeight: 700 }}>
          Cambiá tu clave
        </h1>
        <p style={{ margin: "0 0 26px", fontSize: 13.5, color: "var(--text-muted)" }}>
          Es tu primer ingreso — elegí una clave nueva antes de continuar.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field
            label="Clave nueva"
            type="password"
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
            minLength={6}
            required
            autoFocus
          />
          <Field
            label="Confirmar clave"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            minLength={6}
            required
          />

          {error && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--danger)" }}>
              <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <Button type="submit" loading={cargando} style={{ width: "100%" }}>
            Guardar y continuar
          </Button>
        </form>
      </div>
    </main>
  );
}
