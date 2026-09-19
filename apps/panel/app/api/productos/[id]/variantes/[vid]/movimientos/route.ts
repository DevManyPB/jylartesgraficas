import { movimientoSchema } from "@jyl/core";
import { avisarAlSitio, registrarMovimientoVariante } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Registra un movimiento de stock — SPEC.md §6.4. Admin y operador (§6.1). */
export async function POST(
  request: Request,
  ctx: RouteContext<"/api/productos/[id]/variantes/[vid]/movimientos">,
) {
  const guardia = await exigirRol(["admin", "operador"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id, vid } = await ctx.params;
  const datos = movimientoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const resultado = await registrarMovimientoVariante(id, vid, datos.data, guardia.sesion.uid);
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.mensaje, campos: { cantidad: resultado.mensaje } }, { status: 409 });
    }
    // El stock cambia lo que la tienda muestra: agotado o disponible.
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ ok: true, stockNuevo: resultado.stockNuevo });
  } catch {
    return errorDelServidor("No pudimos registrar el movimiento. Inténtalo de nuevo.");
  }
}
