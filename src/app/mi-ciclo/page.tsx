import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { cicloActual } from "@/lib/ciclo";
import { totalPuntosCiclo, registrosDelCiclo } from "@/lib/registros";
import { calcularProductividadEstimada, puntosParaSiguienteTramo } from "@/lib/comision";
import CerrarSesionBoton from "@/app/_componentes/CerrarSesionBoton";
import ActivarNotificaciones from "@/app/_componentes/ActivarNotificaciones";

export const dynamic = "force-dynamic"; // siempre calculado en vivo, nunca cacheado

export default async function MiCicloPage() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");

  const { inicio, fin } = cicloActual();
  const puntos = await totalPuntosCiclo(usuario.id, inicio);
  const resultado = await calcularProductividadEstimada(puntos);
  const siguienteTramo = await puntosParaSiguienteTramo(puntos);
  const registros = await registrosDelCiclo(usuario.id, inicio);

  const formatoFecha = (d: Date) =>
    d.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
  const formatoPlata = (n: number) =>
    n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>Hola, {usuario.nombre}</h1>
          <p style={styles.subtitulo}>
            Ciclo actual: {formatoFecha(inicio)} — {formatoFecha(fin)}
          </p>
        </div>
        <CerrarSesionBoton />
      </div>

      <div style={{ marginBottom: 16 }}>
        <ActivarNotificaciones />
      </div>

      <div style={styles.tarjetaGrande}>
        <p style={styles.etiqueta}>Puntos facturados este ciclo</p>
        <p style={styles.numeroGrande}>{puntos.toLocaleString("es-CO")}</p>

        {resultado.estado === "bajo_minimo" && (
          <p style={styles.aviso}>
            Todavía no llegás al mínimo para comisionar ({resultado.minimoRequerido.toLocaleString("es-CO")} puntos).
          </p>
        )}

        {resultado.estado !== "bajo_minimo" && (
          <>
            <p style={styles.etiqueta}>Productividad estimada</p>
            <p style={styles.numeroMediano}>{formatoPlata(resultado.produccionEstimada)}</p>
            <p style={styles.comision}>Comisión actual: {(resultado.comision * 100).toFixed(0)}%</p>
          </>
        )}

        {siguienteTramo && (
          <p style={styles.faltante}>
            Te faltan <strong>{siguienteTramo.puntosFaltantes.toLocaleString("es-CO")} puntos</strong> para
            subir al {(siguienteTramo.siguienteComision * 100).toFixed(0)}% de comisión.
          </p>
        )}

        <p style={styles.disclaimer}>
          * Estimado según puntos facturados. El valor final de nómina puede
          variar por ajustes de calidad, ausentismo o bonos.
        </p>
      </div>

      <a href="/registrar" style={styles.botonPrincipal}>
        Cargar visitas de hoy
      </a>

      <section style={styles.historial}>
        <h2 style={styles.subtituloSeccion}>Historial del ciclo</h2>
        {registros.length === 0 && <p style={styles.vacio}>Todavía no cargaste visitas en este ciclo.</p>}
        {registros.map((r) => (
          <div key={r.id} style={styles.filaHistorial}>
            <span>{formatoFecha(r.fechaVisita)}</span>
            <span>{r.cantidadSinCambio} sin cambio + {r.cantidadConCambio} con cambio</span>
            <strong>{r.puntosTotal} pts</strong>
          </div>
        ))}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 24,
    maxWidth: 480,
    margin: "0 auto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  titulo: { margin: 0, fontSize: 22 },
  subtitulo: { margin: "4px 0 0", color: "#666", fontSize: 13 },
  tarjetaGrande: {
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    marginBottom: 16,
  },
  etiqueta: { margin: "0 0 4px", fontSize: 13, color: "#777" },
  numeroGrande: { margin: "0 0 16px", fontSize: 36, fontWeight: 700 },
  numeroMediano: { margin: "0 0 4px", fontSize: 26, fontWeight: 700, color: "#15803d" },
  comision: { margin: "0 0 16px", fontSize: 13, color: "#666" },
  aviso: { background: "#fef3c7", padding: 12, borderRadius: 8, fontSize: 14, margin: "0 0 8px" },
  faltante: { background: "#eff6ff", padding: 12, borderRadius: 8, fontSize: 14, margin: "8px 0" },
  disclaimer: { fontSize: 11, color: "#999", margin: "12px 0 0" },
  botonPrincipal: {
    display: "block",
    textAlign: "center",
    background: "#111",
    color: "#fff",
    padding: 14,
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 16,
    marginBottom: 24,
  },
  historial: { background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  subtituloSeccion: { margin: "0 0 12px", fontSize: 16 },
  vacio: { color: "#999", fontSize: 14 },
  filaHistorial: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
};
