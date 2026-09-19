import { avisarAlSitio, moverProducto } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const cuerpoSchema = z.object({ direccion: z.union([z.literal(-1), z.literal(1)]) });

/** Sube o baja el producto un puesto en la tienda. */
export async function PUT(request: Request, ctx: RouteContext<"/api/productos/[id]/mover">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    if (!(await moverProducto(id, datos.data.direccion))) {
      return NextResponse.json({ error: "Ya está en el extremo de la lista." }, { status: 409 });
    }
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos cambiar el orden. Inténtalo de nuevo.");
  }
}
