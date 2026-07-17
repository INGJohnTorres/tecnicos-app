import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cicloActual } from "@/lib/ciclo";
import { totalPuntosCiclo } from "@/lib/registros";
import { calcularProductividadEstimada } from "@/lib/comision";
import CerrarSesionBoton from "@/app/_componentes/CerrarSesionBoton";

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

  const formatoFecha = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatoPlata = (n: number) =>
    n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Panel administrador</h1>
          <p style={styles.subtitulo}>
            Ciclo actual: {formatoFecha(inicio)} — {formatoFecha(fin)}
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <a href="/admin/cargar" style={styles.botonPrincipal}>
        Cargar visita a nombre de un técnico
      </a>
      <a href="/admin/usuarios" style={styles.botonSecundario}>
        Gestionar usuarios (técnicos)
      </a>

      <div style={styles.lista}>
        {filas.map(({ tecnico, puntos, resultado }) => (
          <div key={tecnico.id} style={styles.tarjeta}>
            <div style={styles.filaTop}>
              <strong>{tecnico.nombre}</strong>
              <span style={styles.puntos}>{puntos.toLocaleString("es-CO")} pts</span>
            </div>
            {resultado.estado === "bajo_minimo" ? (
              <p style={styles.aviso}>Bajo el mínimo ({resultado.minimoRequerido.toLocaleString("es-CO")} pts)</p>
            ) : (
              <p style={styles.produccion}>
                {formatoPlata(resultado.produccionEstimada)} ({(resultado.comision * 100).toFixed(0)}%)
              </p>
            )}
          </div>
        ))}
        {filas.length === 0 && <p style={styles.vacio}>No hay técnicos activos cargados todavía.</p>}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 24,
    maxWidth: 560,
    margin: "0 auto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  titulo: { margin: 0, fontSize: 22 },
  subtitulo: { margin: "4px 0 0", color: "#666", fontSize: 13 },
  botonPrincipal: {
    display: "block",
    textAlign: "center",
    background: "#111",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 15,
    marginBottom: 10,
  },
  botonSecundario: {
    display: "block",
    textAlign: "center",
    background: "#fff",
    color: "#111",
    border: "1px solid #ddd",
    padding: 12,
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 14,
    marginBottom: 20,
  },
  lista: { display: "flex", flexDirection: "column", gap: 12 },
  tarjeta: { background: "#fff", borderRadius: 12, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  filaTop: { display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 15 },
  puntos: { color: "#555" },
  produccion: { margin: 0, color: "#15803d", fontSize: 14, fontWeight: 600 },
  aviso: { margin: 0, color: "#92400e", fontSize: 13 },
  vacio: { color: "#999", fontSize: 14 },
};
