import { avisarAlSitio, emitirFactura } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { errorDelServidor, rechazo } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Emite: número, emisor congelado y stock descontado, en una transacción (SPEC.md §6.5). */
export async function POST(_request: Request, ctx: RouteContext<"/api/facturas/[id]/emitir">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  try {
    const r = await emitirFactura(id, guardia.sesion.uid);
    if (!r.ok) return rechazo(r);
    // Si descontó stock, la tienda puede tener que mostrar un agotado.
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ numero: r.numero });
  } catch {
    return errorDelServidor("No pudimos emitir la factura. No se asignó ningún número; inténtalo de nuevo.");
  }
}
