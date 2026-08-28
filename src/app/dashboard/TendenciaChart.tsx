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
import Card from "@/app/_componentes/ui/Card";

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

const COLOR_GRID = "rgba(255,255,255,0.08)";
const COLOR_AXIS = "#5C6382";
const COLOR_ANTERIOR = "#5C6382";
const COLOR_ACTUAL_START = "#4F7CFF";
const COLOR_ACTUAL_END = "#B85CFF";

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
    <Card glow style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,.05)", borderRadius: 10, padding: 3, border: "1px solid var(--border)" }}>
          <button
            onClick={() => setMetrica("visitas")}
            className={metrica === "visitas" ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
            style={{ boxShadow: "none" }}
          >
            Visitas
          </button>
          <button
            onClick={() => setMetrica("puntos")}
            className={metrica === "puntos" ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm"}
            style={{ boxShadow: "none" }}
          >
            Puntos
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 28, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--text-faint)" }}>{etiquetaActual}</p>
          <p className="num" style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700 }}>
            {totales.actual.toLocaleString("es-CO")}
          </p>
        </div>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--text-faint)" }}>{etiquetaAnterior}</p>
          <p className="num" style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--text-muted)" }}>
            {totales.anterior.toLocaleString("es-CO")}
          </p>
        </div>
        {variacion !== null && (
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--text-faint)" }}>Variación</p>
            <p className="num" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: variacion >= 0 ? "var(--success)" : "var(--danger)" }}>
              {variacion >= 0 ? "+" : ""}
              {variacion.toFixed(0)}%
            </p>
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={datos} margin={{ top: 8, right: 12, left: -12, bottom: 4 }}>
            <defs>
              <linearGradient id="lineaActual" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={COLOR_ACTUAL_START} />
                <stop offset="100%" stopColor={COLOR_ACTUAL_END} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={COLOR_GRID} />
            <XAxis
              dataKey="diaCiclo"
              tick={{ fontSize: 12, fill: COLOR_AXIS }}
              stroke={COLOR_GRID}
              label={{ value: "Día del ciclo", position: "insideBottom", offset: -2, fontSize: 12, fill: COLOR_AXIS }}
            />
            <YAxis tick={{ fontSize: 12, fill: COLOR_AXIS }} stroke={COLOR_GRID} />
            <Tooltip
              formatter={(value) => (typeof value === "number" ? value.toLocaleString("es-CO") : value)}
              labelFormatter={(dia) => `Día ${dia} del ciclo`}
              contentStyle={{
                background: "#10162A",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                fontSize: 12.5,
                color: "#E9ECF6",
              }}
              labelStyle={{ color: "#8B93AE" }}
            />
            <Legend wrapperStyle={{ fontSize: 12.5, color: "#8B93AE" }} />
            <Line
              type="monotone"
              dataKey="anterior"
              name={etiquetaAnterior}
              stroke={COLOR_ANTERIOR}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name={etiquetaActual}
              stroke="url(#lineaActual)"
              strokeWidth={2.75}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function calcularVariacion(actual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return ((actual - anterior) / anterior) * 100;
}
