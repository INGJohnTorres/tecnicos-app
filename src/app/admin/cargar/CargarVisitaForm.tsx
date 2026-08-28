"use client";

import { useState, useEffect, useCallback } from "react";
import { hoyBogotaISO } from "@/lib/ciclo";
import Card from "@/app/_componentes/ui/Card";
import Button from "@/app/_componentes/ui/Button";
import { Field, SelectField } from "@/app/_componentes/ui/Field";
import { IconAlertTriangle, IconCheckCircle, IconEdit, IconTrash } from "@/app/_componentes/ui/Icons";

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
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <Card glow>
        <p style={{ margin: "0 0 18px", fontSize: 12.5, color: "var(--text-muted)" }}>
          Esto queda registrado como cargado por el administrador, no por el técnico. Si el técnico ya tenía algo
          cargado ese día, esto lo reemplaza.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SelectField label="Técnico" value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
            {tecnicos.map((t) => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </SelectField>

          <Field
            label="Fecha de la visita"
            type="date"
            value={fechaVisita}
            onChange={(e) => setFechaVisita(e.target.value)}
          />

          <Field
            label="Visitas SIN cambio (76 pts c/u)"
            type="number"
            min={0}
            value={cantidadSinCambio}
            onChange={(e) => setCantidadSinCambio(Math.max(0, Number(e.target.value)))}
          />

          <Field
            label="Visitas CON cambio (66 pts c/u)"
            type="number"
            min={0}
            value={cantidadConCambio}
            onChange={(e) => setCantidadConCambio(Math.max(0, Number(e.target.value)))}
          />

          {mensaje && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: mensaje.tipo === "ok" ? "var(--success)" : "var(--danger)" }}>
              {mensaje.tipo === "ok" ? <IconCheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
              {mensaje.texto}
            </div>
          )}

          <Button type="submit" loading={guardando} disabled={!usuarioId} style={{ width: "100%" }}>
            Guardar
          </Button>
        </form>
      </Card>

      <div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          Registros del ciclo actual
        </div>
        <div className="card" style={{ overflow: "hidden", padding: 0 }}>
          {cargandoLista && <div style={{ padding: 20, fontSize: 13, color: "var(--text-faint)" }}>Cargando...</div>}
          {!cargandoLista && registros.length === 0 && (
            <div style={{ padding: 20, fontSize: 13, color: "var(--text-faint)" }}>Este técnico todavía no cargó nada en el ciclo actual.</div>
          )}
          {!cargandoLista && registros.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Fecha</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Sin cambio</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Con cambio</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Puntos</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r) => (
                    <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={tdStyle}>{r.fechaVisita.slice(0, 10)}</td>
                      <td className="num" style={{ ...tdStyle, textAlign: "right" }}>{r.cantidadSinCambio}</td>
                      <td className="num" style={{ ...tdStyle, textAlign: "right" }}>{r.cantidadConCambio}</td>
                      <td className="num" style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{r.puntosTotal}</td>
                      <td style={{ ...tdStyle, display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button onClick={() => editar(r)} className="btn btn-secondary btn-sm" style={{ padding: "6px 10px" }}>
                          <IconEdit size={13} />
                        </button>
                        <button onClick={() => eliminar(r)} className="btn btn-danger btn-sm" style={{ padding: "6px 10px" }}>
                          <IconTrash size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 16px",
  fontSize: 10.5,
  color: "var(--text-faint)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".04em",
};
const tdStyle: React.CSSProperties = { padding: "12px 16px", fontSize: 13 };
