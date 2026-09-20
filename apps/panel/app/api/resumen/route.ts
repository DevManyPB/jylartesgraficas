import { recalcularResumen } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/**
 * Recalcula `stats/resumen` — el botón «Actualizar» del tablero. Lo pueden
 * usar admin y operador: el tablero es de los dos, y cada uno ve solo las
 * tarjetas que le tocan (SPEC.md §6.1).
 */
export async function POST() {
  const guardia = await exigirRol(["admin", "operador"]);
  if (!guardia.ok) return guardia.respuesta;

  try {
    const resumen = await recalcularResumen();
    return NextResponse.json({ actualizadoEn: resumen.actualizadoEn });
  } catch {
    return errorDelServidor("No pudimos recalcular las cifras. Inténtalo de nuevo.");
  }
}
