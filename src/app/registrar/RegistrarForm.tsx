"use client";

import { useState, useEffect } from "react";
import { hoyBogotaISO } from "@/lib/ciclo";
import Card from "@/app/_componentes/ui/Card";
import Button from "@/app/_componentes/ui/Button";
import { Field } from "@/app/_componentes/ui/Field";
import { IconAlertTriangle, IconCheckCircle } from "@/app/_componentes/ui/Icons";

export default function RegistrarForm() {
  const [cantidadSinCambio, setCantidadSinCambio] = useState(0);
  const [cantidadConCambio, setCantidadConCambio] = useState(0);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [yaHabiaCargado, setYaHabiaCargado] = useState(false);
  const [cargandoInicial, setCargandoInicial] = useState(true);

  const hoyISO = hoyBogotaISO();
  const puntosPreview = cantidadSinCambio * 76 + cantidadConCambio * 66;

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
      body: JSON.stringify({ fechaVisita: hoyISO, cantidadSinCambio, cantidadConCambio }),
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
    <div style={{ maxWidth: 460, margin: "0 auto" }}>
      <Card glow>
        <h1 style={{ fontFamily: "var(--font-display)", margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>
          Visitas de hoy
        </h1>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--text-faint)" }}>{hoyISO}</p>

        {!cargandoInicial && yaHabiaCargado && (
          <div style={{ marginBottom: 16, fontSize: 12.5, color: "var(--warning)", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: 10, padding: "10px 12px" }}>
            Ya habías cargado hoy — esto es lo que tenías guardado. Podés corregirlo y volver a guardar mientras siga siendo el mismo día.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field
            label="Visitas SIN cambio de equipo (76 pts c/u)"
            type="number"
            min={0}
            value={cantidadSinCambio}
            onChange={(e) => setCantidadSinCambio(Math.max(0, Number(e.target.value)))}
          />
          <Field
            label="Visitas CON cambio de equipo (66 pts c/u)"
            type="number"
            min={0}
            value={cantidadConCambio}
            onChange={(e) => setCantidadConCambio(Math.max(0, Number(e.target.value)))}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--glass)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total del día</span>
            <span className="num" style={{ fontSize: 17, fontWeight: 700, color: "var(--cyan)" }}>{puntosPreview} puntos</span>
          </div>

          {mensaje && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: mensaje.tipo === "ok" ? "var(--success)" : "var(--danger)" }}>
              {mensaje.tipo === "ok" ? (
                <IconCheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              ) : (
                <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              )}
              {mensaje.texto}
            </div>
          )}

          <Button type="submit" loading={guardando} disabled={cargandoInicial} style={{ width: "100%" }}>
            {yaHabiaCargado ? "Corregir visitas de hoy" : "Guardar visitas de hoy"}
          </Button>

          <a href="/mi-ciclo" className="btn btn-ghost" style={{ display: "flex", justifyContent: "center", fontSize: 13, textDecoration: "none" }}>
            Ver mi ciclo actual →
          </a>
        </form>
      </Card>
    </div>
  );
}
