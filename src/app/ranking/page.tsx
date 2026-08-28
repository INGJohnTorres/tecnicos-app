import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cicloActual } from "@/lib/ciclo";
import AppShell from "@/app/_componentes/AppShell";
import { IconTrophy } from "@/app/_componentes/ui/Icons";

export const dynamic = "force-dynamic";

const RANK_STYLES = [
  { background: "var(--grad)", color: "white", border: "none" },
  { background: "rgba(255,255,255,.08)", color: "#E9ECF6", border: "1px solid var(--border-strong)" },
  { background: "rgba(255,255,255,.05)", color: "#8B93AE", border: "1px solid var(--border)" },
];

export default async function RankingPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");

  const { inicio, fin } = cicloActual();

  const tecnicos = await prisma.usuario.findMany({
    where: { rol: "TECNICO", activo: true },
    select: { id: true, nombre: true },
  });

  const conPuntos = await Promise.all(
    tecnicos.map(async (t) => {
      const registros = await prisma.registro.findMany({
        where: { usuarioId: t.id, cicloInicio: inicio },
      });
      const puntos = registros.reduce((acc, r) => acc + r.puntosTotal, 0);
      const visitas = registros.reduce((acc, r) => acc + r.cantidadSinCambio + r.cantidadConCambio, 0);
      return { id: t.id, nombre: t.nombre, puntos, visitas };
    })
  );

  conPuntos.sort((a, b) => b.puntos - a.puntos);

  const formatoFecha = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", timeZone: "UTC" });

  return (
    <AppShell
      usuario={usuario}
      activo="ranking"
      titulo="Ranking del ciclo"
      subtitulo={`Del ${formatoFecha(inicio)} al ${formatoFecha(fin)} — según puntos cargados hasta ahora`}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        {conPuntos.length === 0 && (
          <div className="card" style={{ textAlign: "center", color: "var(--text-faint)", fontSize: 14, padding: 24 }}>
            Todavía nadie cargó visitas en este ciclo.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {conPuntos.map((t, i) => {
            const esVos = t.id === usuario.id;
            const estilo = RANK_STYLES[i] ?? { background: "rgba(255,255,255,.03)", color: "var(--text-faint)", border: "1px solid var(--border)" };
            return (
              <div
                key={t.id}
                className={i === 0 ? "card card-glow" : "card"}
                style={{
                  padding: "18px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  border: esVos ? "1.5px solid var(--cyan)" : undefined,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 16,
                    flexShrink: 0,
                    ...estilo,
                  }}
                >
                  {i < 3 ? <IconTrophy size={18} /> : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>
                    {t.nombre} {esVos && <span style={{ color: "var(--cyan)", fontWeight: 600 }}>(vos)</span>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{t.visitas} visitas cargadas</div>
                </div>
                <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                  {t.puntos.toLocaleString("es-CO")}
                  <span style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 500, marginLeft: 4 }}>pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
