import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cicloActual, formatoFecha } from "@/lib/ciclo";
import { totalPuntosCiclo } from "@/lib/registros";
import { calcularProductividadEstimada } from "@/lib/comision";
import AppShell from "@/app/_componentes/AppShell";
import Card from "@/app/_componentes/ui/Card";
import Badge from "@/app/_componentes/ui/Badge";
import { IconUsers, IconTrendingUp, IconTrophy } from "@/app/_componentes/ui/Icons";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMIN") redirect("/mi-ciclo");

  const { inicio, fin } = cicloActual();
  const tecnicos = await prisma.usuario.findMany({
    where: { rol: "TECNICO", activo: true },
    orderBy: { nombre: "asc" },
  });

  const filas = await Promise.all(
    tecnicos.map(async (t) => {
      const puntos = await totalPuntosCiclo(t.id, inicio);
      const resultado = await calcularProductividadEstimada(puntos);
      return { tecnico: t, puntos, resultado };
    })
  );

  const totalPuntos = filas.reduce((acc, f) => acc + f.puntos, 0);
  const lider = filas.length
    ? filas.reduce((max, f) => (f.puntos > max.puntos ? f : max), filas[0])
    : null;

  const formatoPlata = (n: number) =>
    n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  return (
    <AppShell
      usuario={usuario}
      activo="panel"
      titulo="Panel administrador"
      subtitulo="Vista general del ciclo en curso"
      ciclo={`Ciclo ${formatoFecha(inicio)} – ${formatoFecha(fin)}`}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 28 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Técnicos activos
            </span>
            <IconUsers size={17} style={{ color: "var(--cyan)" }} />
          </div>
          <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700 }}>{tecnicos.length}</div>
        </Card>

        <Card glow>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Puntos del ciclo
            </span>
            <IconTrendingUp size={17} style={{ color: "var(--cyan)" }} />
          </div>
          <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700, background: "var(--grad)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {totalPuntos.toLocaleString("es-CO")}
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Líder del ciclo
            </span>
            <IconTrophy size={17} style={{ color: "var(--cyan)" }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700 }}>
            {lider ? lider.tecnico.nombre : "—"}
          </div>
          {lider && (
            <div className="num" style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>
              {lider.puntos.toLocaleString("es-CO")} pts en el ciclo
            </div>
          )}
        </Card>
      </div>

      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--border)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 700 }}>Técnicos del ciclo</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a href="/admin/cargar" className="btn btn-primary btn-sm">Cargar visita</a>
            <a href="/admin/usuarios" className="btn btn-secondary btn-sm">Usuarios</a>
          </div>
        </div>

        {filas.length === 0 ? (
          <div style={{ padding: 24, color: "var(--text-faint)", fontSize: 14 }}>No hay técnicos activos cargados todavía.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Técnico</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Puntos</th>
                  <th style={thStyle}>Producción estimada</th>
                  <th style={thStyle}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ tecnico, puntos, resultado }) => (
                  <tr key={tecnico.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 999, background: "var(--bg-elevated)", border: "1px solid var(--border-strong)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "var(--text-muted)" }}>
                          {tecnico.nombre.slice(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{tecnico.nombre}</span>
                      </div>
                    </td>
                    <td className="num" style={{ ...tdStyle, textAlign: "right", fontWeight: 700 }}>{puntos.toLocaleString("es-CO")}</td>
                    <td style={tdStyle}>
                      {resultado.estado === "bajo_minimo" ? (
                        <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>—</span>
                      ) : (
                        <span className="num" style={{ fontSize: 13 }}>{formatoPlata(resultado.produccionEstimada)}</span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {resultado.estado === "bajo_minimo" ? (
                        <Badge variant="warning">Bajo el mínimo ({resultado.minimoRequerido.toLocaleString("es-CO")} pts)</Badge>
                      ) : (
                        <Badge variant="success">Comisionando {(resultado.comision * 100).toFixed(0)}%</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 24px",
  fontSize: 11,
  color: "var(--text-faint)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: ".05em",
};
const tdStyle: React.CSSProperties = { padding: "16px 24px" };
