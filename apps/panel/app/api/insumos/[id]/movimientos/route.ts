import { movimientoSchema } from "@jyl/core";
import { registrarMovimientoInsumo } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Movimiento de un insumo. Admin y operador. */
export async function POST(request: Request, ctx: RouteContext<"/api/insumos/[id]/movimientos">) {
  const guardia = await exigirRol(["admin", "operador"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = movimientoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const resultado = await registrarMovimientoInsumo(id, datos.data, guardia.sesion.uid);
    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.mensaje, campos: { cantidad: resultado.mensaje } }, { status: 409 });
    }
    return NextResponse.json({ ok: true, stockNuevo: resultado.stockNuevo });
  } catch {
    return errorDelServidor("No pudimos registrar el movimiento. Inténtalo de nuevo.");
  }
}
