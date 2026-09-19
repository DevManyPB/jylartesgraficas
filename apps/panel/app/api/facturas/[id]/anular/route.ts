import { anulacionSchema } from "@jyl/core";
import { anularFactura, avisarAlSitio } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor, rechazo } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Anula con motivo y devuelve el stock que se había descontado (SPEC.md §6.5). */
export async function POST(request: Request, ctx: RouteContext<"/api/facturas/[id]/anular">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = anulacionSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const r = await anularFactura(id, datos.data.motivo, guardia.sesion.uid);
    if (!r.ok) return rechazo(r);
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos anular la factura. Inténtalo de nuevo.");
  }
}
