import { insumoEditableSchema } from "@jyl/core";
import { actualizarInsumo } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

export async function PUT(request: Request, ctx: RouteContext<"/api/insumos/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = insumoEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    if (!(await actualizarInsumo(id, datos.data))) {
      return NextResponse.json({ error: "Ese insumo ya no existe." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar el insumo. Inténtalo de nuevo.");
  }
}
