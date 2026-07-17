import { NextRequest, NextResponse } from "next/server";
import { calcularProductividadEstimada, puntosParaSiguienteTramo } from "@/lib/comision";

// Endpoint de prueba para la Fase 0: confirma que la tabla de comisión
// quedó bien cargada y que el lookup da los mismos resultados que ya
// validamos contra la planilla real de nómina.
//
// Ejemplo: GET /api/comision?puntos=9628  -> $1.251.640 (Ocampo Ríos)
export async function GET(req: NextRequest) {
  const puntosParam = req.nextUrl.searchParams.get("puntos");
  const puntos = Number(puntosParam);

  if (!puntosParam || Number.isNaN(puntos)) {
    return NextResponse.json(
      { error: "Pasá un ?puntos=NUMERO en la URL" },
      { status: 400 }
    );
  }

  const resultado = await calcularProductividadEstimada(puntos);
  const siguienteTramo = await puntosParaSiguienteTramo(puntos);

  return NextResponse.json({
    puntosConsultados: puntos,
    resultado,
    siguienteTramo,
  });
}
