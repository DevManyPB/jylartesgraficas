import { productoEditableSchema } from "@jyl/core";
import { actualizarProducto, avisarAlSitio, eliminarProducto, ErrorDeInventario } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const noExiste = () => NextResponse.json({ error: "Ese producto ya no existe." }, { status: 404 });

export async function PUT(request: Request, ctx: RouteContext<"/api/productos/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = productoEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    if (!(await actualizarProducto(id, datos.data))) return noExiste();
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ErrorDeInventario) return NextResponse.json({ error: error.message }, { status: 400 });
    return errorDelServidor("No pudimos guardar el producto. Inténtalo de nuevo.");
  }
}

/** SPEC.md §5.1: eliminar exige escribir el nombre; eso lo pide el panel antes de llamar aquí. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/productos/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  try {
    if (!(await eliminarProducto(id))) return noExiste();
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos eliminar el producto. Inténtalo de nuevo.");
  }
}
