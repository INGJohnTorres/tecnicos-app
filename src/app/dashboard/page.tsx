import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cicloActual, cicloAnterior, hoyBogota, formatoFecha } from "@/lib/ciclo";
import {
  combinarSeriesComparativas,
  serieDiariaCiclo,
  serieDiariaCicloEquipo,
  type PuntoSerieDia,
} from "@/lib/registros";
import CerrarSesionBoton from "@/app/_componentes/CerrarSesionBoton";
import TendenciaChart from "./TendenciaChart";

export const dynamic = "force-dynamic";

function totalDeSerie(serie: PuntoSerieDia[], campo: "visitasAcumuladas" | "puntosAcumulados") {
  return serie.length ? serie[serie.length - 1][campo] : 0;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { tecnico?: string };
}) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");

  const actual = cicloActual();
  const anterior = cicloAnterior(actual.inicio);
  // El ciclo actual todavía está en curso: no tiene sentido graficar días
  // futuros, así que la serie corta hasta hoy.
  const finActualEfectivo = actual.fin < hoyBogota() ? actual.fin : hoyBogota();

  const etiquetaActual = `Ciclo actual (${formatoFecha(actual.inicio)} - ${formatoFecha(actual.fin)})`;
  const etiquetaAnterior = `Ciclo anterior (${formatoFecha(anterior.inicio)} - ${formatoFecha(anterior.fin)})`;

  let titulo: string;
  let tecnicoSeleccionado: { id: string; nombre: string } | null = null;
  let listaTecnicos: { id: string; nombre: string }[] = [];

  let serieActual: PuntoSerieDia[];
  let serieAnterior: PuntoSerieDia[];

  if (usuario.rol === "ADMIN") {
    listaTecnicos = await prisma.usuario.findMany({
      where: { rol: "TECNICO", activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    });

    if (searchParams.tecnico) {
      const tecnico = listaTecnicos.find((t) => t.id === searchParams.tecnico);
      if (!tecnico) redirect("/dashboard");
      tecnicoSeleccionado = tecnico;
      titulo = `Tendencia de ${tecnico.nombre}`;
      [serieActual, serieAnterior] = await Promise.all([
        serieDiariaCiclo(tecnico.id, actual.inicio, finActualEfectivo),
        serieDiariaCiclo(tecnico.id, anterior.inicio, anterior.fin),
      ]);
    } else {
      titulo = "Tendencia del equipo";
      [serieActual, serieAnterior] = await Promise.all([
        serieDiariaCicloEquipo(actual.inicio, finActualEfectivo),
        serieDiariaCicloEquipo(anterior.inicio, anterior.fin),
      ]);
    }
  } else {
    titulo = "Tu tendencia";
    [serieActual, serieAnterior] = await Promise.all([
      serieDiariaCiclo(usuario.id, actual.inicio, finActualEfectivo),
      serieDiariaCiclo(usuario.id, anterior.inicio, anterior.fin),
    ]);
  }

  const serieVisitas = combinarSeriesComparativas(serieActual, serieAnterior, "visitas");
  const seriePuntos = combinarSeriesComparativas(serieActual, serieAnterior, "puntos");

  const totalesVisitas = {
    actual: totalDeSerie(serieActual, "visitasAcumuladas"),
    anterior: totalDeSerie(serieAnterior, "visitasAcumuladas"),
  };
  const totalesPuntos = {
    actual: totalDeSerie(serieActual, "puntosAcumulados"),
    anterior: totalDeSerie(serieAnterior, "puntosAcumulados"),
  };

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.titulo}>{titulo}</h1>
          <p style={styles.subtitulo}>Progreso acumulado, día a día del ciclo</p>
        </div>
        <CerrarSesionBoton />
      </div>

      <a href={usuario.rol === "ADMIN" ? "/admin" : "/mi-ciclo"} style={styles.volver}>
        ← Volver
      </a>

      {usuario.rol === "ADMIN" && (
        <div style={styles.selector}>
          <a href="/dashboard" style={!tecnicoSeleccionado ? styles.chipActivo : styles.chip}>
            Equipo
          </a>
          {listaTecnicos.map((t) => (
            <a
              key={t.id}
              href={`/dashboard?tecnico=${t.id}`}
              style={tecnicoSeleccionado?.id === t.id ? styles.chipActivo : styles.chip}
            >
              {t.nombre}
            </a>
          ))}
        </div>
      )}

      <TendenciaChart
        serieVisitas={serieVisitas}
        seriePuntos={seriePuntos}
        totalesVisitas={totalesVisitas}
        totalesPuntos={totalesPuntos}
        etiquetaActual={etiquetaActual}
        etiquetaAnterior={etiquetaAnterior}
      />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    fontFamily: "sans-serif",
    background: "#f5f5f5",
    padding: 24,
    maxWidth: 720,
    margin: "0 auto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  titulo: { margin: 0, fontSize: 22 },
  subtitulo: { margin: "4px 0 0", color: "#666", fontSize: 13 },
  volver: { display: "inline-block", color: "#555", fontSize: 13, textDecoration: "none", marginBottom: 16 },
  selector: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  chip: {
    background: "#fff",
    border: "1px solid #ddd",
    color: "#333",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 13,
    textDecoration: "none",
  },
  chipActivo: {
    background: "#111",
    border: "1px solid #111",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 13,
    textDecoration: "none",
    fontWeight: 600,
  },
};
