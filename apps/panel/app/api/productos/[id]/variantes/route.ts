import { varianteNuevaSchema } from "@jyl/core";
import { avisarAlSitio, crearVariante } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Crea una variante; su stock inicial entra como primer movimiento. Solo admin. */
export async function POST(request: Request, ctx: RouteContext<"/api/productos/[id]/variantes">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = varianteNuevaSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const variantId = await crearVariante(id, datos.data, guardia.sesion.uid);
    if (!variantId) return NextResponse.json({ error: "Ese producto ya no existe." }, { status: 404 });
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ id: variantId }, { status: 201 });
  } catch {
    return errorDelServidor("No pudimos crear la variante. Inténtalo de nuevo.");
  }
}
