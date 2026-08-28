import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { cicloActual, formatoFecha } from "@/lib/ciclo";
import { totalPuntosCiclo, registrosDelCiclo } from "@/lib/registros";
import { calcularProductividadEstimada, puntosParaSiguienteTramo } from "@/lib/comision";
import AppShell from "@/app/_componentes/AppShell";
import ActivarNotificaciones from "@/app/_componentes/ActivarNotificaciones";
import Card from "@/app/_componentes/ui/Card";
import Button from "@/app/_componentes/ui/Button";
import { IconPlusCircle, IconTrendingUp, IconAlertTriangle } from "@/app/_componentes/ui/Icons";

export const dynamic = "force-dynamic"; // siempre calculado en vivo, nunca cacheado

export default async function MiCicloPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");

  const { inicio, fin } = cicloActual();
  const puntos = await totalPuntosCiclo(usuario.id, inicio);
  const resultado = await calcularProductividadEstimada(puntos);
  const siguienteTramo = await puntosParaSiguienteTramo(puntos);
  const registros = await registrosDelCiclo(usuario.id, inicio);

  const formatoPlata = (n: number) =>
    n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  return (
    <AppShell
      usuario={usuario}
      activo="panel"
      titulo={`Hola, ${usuario.nombre}`}
      ciclo={`Ciclo ${formatoFecha(inicio)} – ${formatoFecha(fin)}`}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <ActivarNotificaciones />

        <Card glow>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
            Puntos facturados este ciclo
          </div>
          <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 42, fontWeight: 700, margin: "6px 0 0", background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {puntos.toLocaleString("es-CO")}
          </div>

          {resultado.estado === "bajo_minimo" && (
            <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "var(--warning)", background: "var(--warning-bg)", border: "1px solid var(--warning-border)", borderRadius: 10, padding: "10px 12px" }}>
              <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              Todavía no llegás al mínimo para comisionar ({resultado.minimoRequerido.toLocaleString("es-CO")} puntos).
            </div>
          )}

          {resultado.estado !== "bajo_minimo" && (
            <>
              <div style={{ height: 1, background: "var(--border)", margin: "16px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Producción estimada</div>
                  <div style={{ fontSize: 19, fontWeight: 700, marginTop: 3 }}>{formatoPlata(resultado.produccionEstimada)}</div>
                </div>
                <div className="badge badge-info">{(resultado.comision * 100).toFixed(0)}% comisión</div>
              </div>
            </>
          )}

          {siguienteTramo && (
            <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12.5, color: "var(--text-muted)" }}>
              <IconTrendingUp size={15} style={{ color: "var(--cyan)", flexShrink: 0, marginTop: 1 }} />
              Te faltan{" "}
              <strong style={{ color: "var(--text)" }}>{siguienteTramo.puntosFaltantes.toLocaleString("es-CO")} puntos</strong>{" "}
              para subir al {(siguienteTramo.siguienteComision * 100).toFixed(0)}% de comisión.
            </div>
          )}

          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "16px 0 0" }}>
            * Estimado según puntos facturados. El valor final de nómina puede variar por ajustes de calidad, ausentismo o bonos.
          </p>
        </Card>

        <a href="/registrar" style={{ textDecoration: "none" }}>
          <Button style={{ width: "100%" }}>
            <IconPlusCircle size={16} />
            Cargar visitas de hoy
          </Button>
        </a>

        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
            Historial del ciclo
          </div>
          {registros.length === 0 && (
            <Card style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 13.5 }}>
              Todavía no cargaste visitas en este ciclo.
            </Card>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {registros.map((r) => (
              <Card key={r.id} style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{formatoFecha(r.fechaVisita)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>
                    {r.cantidadSinCambio} sin cambio + {r.cantidadConCambio} con cambio
                  </div>
                </div>
                <div className="num" style={{ fontSize: 14, fontWeight: 700, color: "var(--cyan)" }}>{r.puntosTotal} pts</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
