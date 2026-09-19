import { borradorFacturaSchema } from "@jyl/core";
import { actualizarBorrador, eliminarBorrador } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor, rechazo } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Guarda un borrador. Una factura emitida no se edita (SPEC.md §6.5). */
export async function PUT(request: Request, ctx: RouteContext<"/api/facturas/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = borradorFacturaSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const r = await actualizarBorrador(id, datos.data);
    return r.ok ? NextResponse.json({ ok: true }) : rechazo(r);
  } catch {
    return errorDelServidor("No pudimos guardar la factura. Inténtalo de nuevo.");
  }
}

/** Solo borra borradores: una emitida se anula. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/facturas/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  try {
    const r = await eliminarBorrador(id);
    return r.ok ? NextResponse.json({ ok: true }) : rechazo(r);
  } catch {
    return errorDelServidor("No pudimos eliminar el borrador. Inténtalo de nuevo.");
  }
}
