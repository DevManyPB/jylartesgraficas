import { configuracionSchema } from "@jyl/core";
import { avisarAlSitio, guardarConfiguracion } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Guarda `settings/general` — SPEC.md §6.8. Solo admin (§6.1). */
export async function PUT(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = configuracionSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    await guardarConfiguracion(datos.data, guardia.sesion.uid);
    // El sitio público se entera después de responder: el admin no espera.
    after(() => avisarAlSitio(["configuracion"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar la configuración. Inténtalo de nuevo.");
  }
}
