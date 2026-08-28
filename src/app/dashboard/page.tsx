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
import AppShell, { type SeccionActiva } from "@/app/_componentes/AppShell";
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

  const activo: SeccionActiva = "tendencias";

  return (
    <AppShell usuario={usuario} activo={activo} titulo={titulo} subtitulo="Progreso acumulado, día a día del ciclo">
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {usuario.rol === "ADMIN" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            <a href="/dashboard" className={`btn btn-sm ${!tecnicoSeleccionado ? "btn-primary" : "btn-secondary"}`}>
              Equipo
            </a>
            {listaTecnicos.map((t) => (
              <a
                key={t.id}
                href={`/dashboard?tecnico=${t.id}`}
                className={`btn btn-sm ${tecnicoSeleccionado?.id === t.id ? "btn-primary" : "btn-secondary"}`}
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
      </div>
    </AppShell>
  );
}
