import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cicloActual } from "@/lib/ciclo";

export const dynamic = "force-dynamic";

const MEDALLAS = ["🥇", "🥈", "🥉"];
const COLORES = [
  { fondo: "linear-gradient(135deg, #f4d35e, #e8b923)", texto: "#3d2e00" },
  { fondo: "linear-gradient(135deg, #cfd8dc, #90a4ae)", texto: "#1c2226" },
  { fondo: "linear-gradient(135deg, #d98a4b, #b5652a)", texto: "#2e1a0a" },
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
      const visitas = registros.reduce(
        (acc, r) => acc + r.cantidadSinCambio + r.cantidadConCambio,
        0
      );
      return { id: t.id, nombre: t.nombre, puntos, visitas };
    })
  );

  conPuntos.sort((a, b) => b.puntos - a.puntos);

  const formatoFecha = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", timeZone: "UTC" });

  return (
    <main style={styles.main}>
      <div style={styles.columna}>
        <a href={usuario.rol === "ADMIN" ? "/admin" : "/mi-ciclo"} style={styles.link}>
          ← Volver
        </a>
        <h1 style={styles.titulo}>🏆 Ranking del ciclo actual</h1>
        <p style={styles.nota}>
          Del {formatoFecha(inicio)} al {formatoFecha(fin)} — según puntos
          cargados hasta ahora. Se actualiza solo con cada visita nueva.
        </p>

        {conPuntos.length === 0 && (
          <p style={styles.nota}>Todavía nadie cargó visitas en este ciclo.</p>
        )}

        <div style={styles.podio}>
          {conPuntos.map((t, i) => {
            const color = COLORES[i] ?? { fondo: "#f0f0f0", texto: "#333" };
            const esVos = t.id === usuario.id;
            return (
              <div
                key={t.id}
                style={{
                  ...styles.tarjeta,
                  background: color.fondo,
                  color: color.texto,
                  border: esVos ? "3px solid #111" : "none",
                }}
              >
                <span style={styles.medalla}>{MEDALLAS[i] ?? "🎯"}</span>
                <strong style={styles.nombre}>
                  {t.nombre} {esVos && "(vos)"}
                </strong>
                <span style={styles.puntos}>{t.puntos} pts</span>
                <span style={styles.visitas}>{t.visitas} visitas cargadas</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 16,
    display: "flex",
    justifyContent: "center",
  },
  columna: { width: "100%", maxWidth: 600, display: "flex", flexDirection: "column", gap: 8 },
  titulo: { margin: "8px 0 0", fontSize: 22, textAlign: "center" },
  nota: { fontSize: 13, color: "#777", margin: "0 0 12px", textAlign: "center" },
  link: { fontSize: 13, color: "#2563eb", textDecoration: "none" },
  podio: { display: "flex", flexDirection: "column", gap: 14 },
  tarjeta: {
    borderRadius: 14,
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
  },
  medalla: { fontSize: 34 },
  nombre: { fontSize: 17, textAlign: "center" },
  puntos: { fontSize: 26, fontWeight: 700 },
  visitas: { fontSize: 13, opacity: 0.85 },
};
