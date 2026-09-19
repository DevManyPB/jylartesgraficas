import { proyectoEditableSchema } from "@jyl/core";
import { avisarAlSitio, crearProyecto, ErrorDeCatalogo } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Crea un proyecto del portafolio — SPEC.md §6.7. Solo admin. */
export async function POST(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = proyectoEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const id = await crearProyecto(datos.data);
    after(() => avisarAlSitio(["portafolio"]));
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ErrorDeCatalogo) return NextResponse.json({ error: error.message }, { status: 400 });
    return errorDelServidor("No pudimos crear el proyecto. Inténtalo de nuevo.");
  }
}
