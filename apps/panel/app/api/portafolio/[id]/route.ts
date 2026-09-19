import { proyectoEditableSchema } from "@jyl/core";
import { actualizarProyecto, avisarAlSitio, eliminarProyecto, ErrorDeCatalogo } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const noExiste = () => NextResponse.json({ error: "Ese proyecto ya no existe." }, { status: 404 });

export async function PUT(request: Request, ctx: RouteContext<"/api/portafolio/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = proyectoEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    if (!(await actualizarProyecto(id, datos.data))) return noExiste();
    after(() => avisarAlSitio(["portafolio"]));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ErrorDeCatalogo) return NextResponse.json({ error: error.message }, { status: 400 });
    return errorDelServidor("No pudimos guardar el proyecto. Inténtalo de nuevo.");
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/portafolio/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  try {
    if (!(await eliminarProyecto(id))) return noExiste();
    after(() => avisarAlSitio(["portafolio"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos eliminar el proyecto. Inténtalo de nuevo.");
  }
}
