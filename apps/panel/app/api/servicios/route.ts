import { servicioEditableSchema } from "@jyl/core";
import { avisarAlSitio, crearServicio } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Crea un servicio al final del catálogo — SPEC.md §6.8. Solo admin. */
export async function POST(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = servicioEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const id = await crearServicio(datos.data);
    // El sitio público se entera después de responder: el admin no espera.
    after(() => avisarAlSitio(["servicios"]));
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return errorDelServidor("No pudimos crear el servicio. Inténtalo de nuevo.");
  }
}
