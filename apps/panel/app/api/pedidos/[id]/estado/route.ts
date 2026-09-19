import { cambioEstadoSchema } from "@jyl/core";
import { cambiarEstadoPedido } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Cambia el estado de un pedido — SPEC.md §6.3. Admin y operador (§6.1). */
export async function PUT(request: Request, ctx: RouteContext<"/api/pedidos/[id]/estado">) {
  const guardia = await exigirRol(["admin", "operador"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = cambioEstadoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const resultado = await cambiarEstadoPedido(id, datos.data.estado, guardia.sesion.uid, datos.data.nota);
    if (resultado === "no-existe") {
      return NextResponse.json({ error: "Ese pedido ya no existe." }, { status: 404 });
    }
    if (resultado === "sin-cambio") {
      // Otra persona pudo cambiarlo a este mismo estado mientras tanto.
      return NextResponse.json({ error: "El pedido ya está en ese estado." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos cambiar el estado. Inténtalo de nuevo.");
  }
}
