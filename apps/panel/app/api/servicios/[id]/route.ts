import { servicioEditableSchema } from "@jyl/core";
import { avisarAlSitio, actualizarServicio } from "@jyl/core/server";
import { after, NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/**
 * Edita un servicio. No hay DELETE a propósito: los pedidos guardan
 * `serviceId`, y borrar el servicio los dejaría apuntando a nada. Para
 * retirarlo del sitio se desactiva.
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/servicios/[id]">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = servicioEditableSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const existia = await actualizarServicio(id, datos.data);
    if (!existia) {
      return NextResponse.json({ error: "Ese servicio ya no existe." }, { status: 404 });
    }
    // El sitio público se entera después de responder: el admin no espera.
    after(() => avisarAlSitio(["servicios"]));
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar el servicio. Inténtalo de nuevo.");
  }
}
