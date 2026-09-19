import { varianteEditableSchema } from "@jyl/core";
import { actualizarVariante, avisarAlSitio } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Edita talla, color, precios y mínimo. El stock no: solo cambia por movimientos. */
export async function PUT(request: Request, ctx: RouteContext<"/api/productos/[id]/variantes/[vid]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id, vid } = await ctx.params;
  const datos = varianteEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    if (!(await actualizarVariante(id, vid, datos.data))) {
      return NextResponse.json({ error: "Esa variante ya no existe." }, { status: 404 });
    }
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar la variante. Inténtalo de nuevo.");
  }
}
