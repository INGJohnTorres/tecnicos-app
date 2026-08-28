"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PuntoComparativo } from "@/lib/registros";

type Totales = {
  actual: number;
  anterior: number;
};

type Props = {
  serieVisitas: PuntoComparativo[];
  seriePuntos: PuntoComparativo[];
  totalesVisitas: Totales;
  totalesPuntos: Totales;
  etiquetaActual: string;
  etiquetaAnterior: string;
};

type Metrica = "visitas" | "puntos";

export default function TendenciaChart({
  serieVisitas,
  seriePuntos,
  totalesVisitas,
  totalesPuntos,
  etiquetaActual,
  etiquetaAnterior,
}: Props) {
  const [metrica, setMetrica] = useState<Metrica>("visitas");

  const datos = metrica === "visitas" ? serieVisitas : seriePuntos;
  const totales = metrica === "visitas" ? totalesVisitas : totalesPuntos;
  const variacion = calcularVariacion(totales.actual, totales.anterior);

  return (
    <div style={styles.tarjeta}>
      <div style={styles.filaTop}>
        <div style={styles.toggle}>
          <button
            onClick={() => setMetrica("visitas")}
            style={metrica === "visitas" ? styles.toggleBotonActivo : styles.toggleBoton}
          >
            Visitas
          </button>
          <button
            onClick={() => setMetrica("puntos")}
            style={metrica === "puntos" ? styles.toggleBotonActivo : styles.toggleBoton}
          >
            Puntos
          </button>
        </div>
      </div>

      <div style={styles.resumen}>
        <div>
          <p style={styles.etiquetaResumen}>{etiquetaActual}</p>
          <p style={styles.numeroResumen}>{totales.actual.toLocaleString("es-CO")}</p>
        </div>
        <div>
          <p style={styles.etiquetaResumen}>{etiquetaAnterior}</p>
          <p style={styles.numeroResumenSecundario}>{totales.anterior.toLocaleString("es-CO")}</p>
        </div>
        {variacion !== null && (
          <div>
            <p style={styles.etiquetaResumen}>Variación</p>
            <p style={{ ...styles.numeroResumenSecundario, color: variacion >= 0 ? "#15803d" : "#b91c1c" }}>
              {variacion >= 0 ? "+" : ""}
              {variacion.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={datos} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="diaCiclo"
              tick={{ fontSize: 12 }}
              label={{ value: "Día del ciclo", position: "insideBottom", offset: -2, fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value) => (typeof value === "number" ? value.toLocaleString("es-CO") : value)}
              labelFormatter={(dia) => `Día ${dia} del ciclo`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="anterior"
              name={etiquetaAnterior}
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name={etiquetaActual}
              stroke="#111827"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function calcularVariacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((actual - anterior) / anterior) * 100;
}

const styles: Record<string, React.CSSProperties> = {
  tarjeta: {
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
  },
  filaTop: { display: "flex", justifyContent: "flex-end", marginBottom: 12 },
  toggle: { display: "flex", background: "#f1f1f1", borderRadius: 10, padding: 3 },
  toggleBoton: {
    border: "none",
    background: "transparent",
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    color: "#555",
  },
  toggleBotonActivo: {
    border: "none",
    background: "#111",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 600,
  },
  resumen: { display: "flex", gap: 24, marginBottom: 8, flexWrap: "wrap" },
  etiquetaResumen: { margin: "0 0 2px", fontSize: 12, color: "#777" },
  numeroResumen: { margin: 0, fontSize: 22, fontWeight: 700 },
  numeroResumenSecundario: { margin: 0, fontSize: 16, fontWeight: 600, color: "#555" },
};
