import { ordenServiciosSchema } from "@jyl/core";
import { avisarAlSitio, reordenarServicios } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Aplica el orden del catálogo, que es el mismo en que lo ve el público. */
export async function PUT(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = ordenServiciosSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const aplicado = await reordenarServicios(datos.data.ids);
    if (!aplicado) {
      // 409: la lista cambió mientras se ordenaba (otra pestaña, otra persona).
      return NextResponse.json(
        { error: "El catálogo cambió mientras lo ordenabas. Recarga y vuelve a intentarlo." },
        { status: 409 },
      );
    }
    // El sitio público se entera después de responder: el admin no espera.
    after(() => avisarAlSitio(["servicios"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar el orden. Inténtalo de nuevo.");
  }
}
