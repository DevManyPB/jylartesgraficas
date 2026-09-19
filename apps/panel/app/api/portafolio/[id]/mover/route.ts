import { avisarAlSitio, moverProyecto } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { z } from "zod";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const cuerpoSchema = z.object({ direccion: z.union([z.literal(-1), z.literal(1)]) });

/** Sube o baja el proyecto un puesto en el portafolio público. */
export async function PUT(request: Request, ctx: RouteContext<"/api/portafolio/[id]/mover">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    if (!(await moverProyecto(id, datos.data.direccion))) {
      return NextResponse.json({ error: "Ya está en el extremo de la lista." }, { status: 409 });
    }
    after(() => avisarAlSitio(["portafolio"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos cambiar el orden. Inténtalo de nuevo.");
  }
}
