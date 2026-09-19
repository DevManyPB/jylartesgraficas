import { productoEditableSchema } from "@jyl/core";
import { avisarAlSitio, crearProducto, ErrorDeInventario } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Crea un producto — SPEC.md §6.4 y §6.7. Solo admin. */
export async function POST(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = productoEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const id = await crearProducto(datos.data);
    after(() => avisarAlSitio(["productos"]));
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorDeInventario) return NextResponse.json({ error: error.message }, { status: 400 });
    return errorDelServidor("No pudimos crear el producto. Inténtalo de nuevo.");
  }
}
