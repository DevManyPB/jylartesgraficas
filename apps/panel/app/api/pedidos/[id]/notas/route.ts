import { notasInternasSchema } from "@jyl/core";
import { guardarNotasInternas } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Notas internas del pedido: las ve solo el estudio, nunca el cliente. */
export async function PUT(request: Request, ctx: RouteContext<"/api/pedidos/[id]/notas">) {
  const guardia = await exigirRol(["admin", "operador"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = notasInternasSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const existe = await guardarNotasInternas(id, datos.data.notasInternas);
    if (!existe) return NextResponse.json({ error: "Ese pedido ya no existe." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar las notas. Inténtalo de nuevo.");
  }
}
