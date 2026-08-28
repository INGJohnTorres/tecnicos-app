"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/app/_componentes/ui/Card";
import Button from "@/app/_componentes/ui/Button";
import Badge from "@/app/_componentes/ui/Badge";
import { Field } from "@/app/_componentes/ui/Field";
import { IconCheckCircle, IconAlertTriangle, IconTrash } from "@/app/_componentes/ui/Icons";

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
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

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

  async function eliminarTecnico(u: Usuario) {
    const confirmado = window.confirm(
      `¿Eliminar a "${u.nombre}" para siempre? Esto solo funciona si todavía no tiene ninguna visita cargada — si ya cargó algo, usá "Desactivar" en su lugar. Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setEliminandoId(u.id);
    const res = await fetch(`/api/usuarios/${u.id}`, { method: "DELETE" });
    const data = await res.json();
    setEliminandoId(null);

    if (!res.ok) {
      setMensaje({ tipo: "error", texto: data.error ?? "No se pudo eliminar" });
      return;
    }

    setMensaje({ tipo: "ok", texto: `"${u.nombre}" fue eliminado.` });
    cargarUsuarios();
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.6 }}>
        Un técnico desactivado no puede entrar a la app y desaparece de las listas activas, pero su historial de
        visitas y comisión queda guardado. "Eliminar" solo funciona si todavía no cargó ninguna visita (por ejemplo,
        si lo creaste por error) — si ya tiene historial, usá "Desactivar" para no perder sus puntos.
      </p>

      {mensaje && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: mensaje.tipo === "ok" ? "var(--success)" : "var(--danger)" }}>
          {mensaje.tipo === "ok" ? <IconCheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} /> : <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />}
          {mensaje.texto}
        </div>
      )}

      {cargando && <p style={{ color: "var(--text-faint)", fontSize: 14 }}>Cargando...</p>}

      {!cargando && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {usuarios.map((u) => (
            <Card key={u.id} style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <strong style={{ fontSize: 14 }}>{u.nombre}</strong>
                <span style={{ color: "var(--text-faint)", fontSize: 12.5 }}>{u.rol === "ADMIN" ? "Administrador" : "Técnico"}</span>
                {!u.activo && <Badge variant="warning">Inactivo</Badge>}
              </div>
              {u.rol === "TECNICO" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => cambiarEstado(u)} className={`btn btn-sm ${u.activo ? "btn-danger" : "btn-secondary"}`}>
                    {u.activo ? "Desactivar" : "Reactivar"}
                  </button>
                  <button
                    onClick={() => eliminarTecnico(u)}
                    disabled={eliminandoId === u.id}
                    title="Eliminar para siempre (solo si no tiene visitas cargadas)"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "6px 10px", color: "var(--danger)" }}
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Card glow>
        <h2 style={{ fontFamily: "var(--font-display)", margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Crear técnico nuevo</h2>
        <form onSubmit={crearTecnico} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field
            label="Usuario (login — minúsculas, sin espacios ni tildes)"
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="ej: mgomez"
            required
          />
          <Field
            label="Clave inicial (el técnico la va a tener que cambiar al entrar)"
            type="text"
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
            placeholder="mínimo 6 caracteres"
            required
          />
          <Button type="submit" loading={creando} style={{ width: "100%" }}>
            Crear técnico
          </Button>
        </form>
      </Card>
    </div>
  );
}
