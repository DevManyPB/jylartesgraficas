import { ordenDelCatalogoSchema } from "@jyl/core";
import { avisarAlSitio, reordenarProyectos } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Orden del portafolio tras arrastrar — SPEC.md §6.7. */
export async function PUT(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = ordenDelCatalogoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const aplicado = await reordenarProyectos(datos.data.ids);
    if (!aplicado) {
      return NextResponse.json(
        { error: "La lista cambió mientras la ordenabas. Recarga y vuelve a intentarlo." },
        { status: 409 },
      );
    }
    after(() => avisarAlSitio(["portafolio"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar el orden. Inténtalo de nuevo.");
  }
}
