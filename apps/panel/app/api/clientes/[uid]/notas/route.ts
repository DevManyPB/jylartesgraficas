import { guardarNotasCliente } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const cuerpoSchema = z.object({
  notas: z.string().max(5000, "Las notas admiten hasta 5.000 caracteres."),
});

/**
 * Notas internas de un cliente — SPEC.md §6.6. Solo admin, como el resto de
 * la ficha. Se guardan en una subcolección que ninguna regla abre, así que
 * el cliente no puede leerlas desde su cuenta.
 */
export async function PUT(request: Request, ctx: RouteContext<"/api/clientes/[uid]/notas">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { uid } = await ctx.params;
  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const guardado = await guardarNotasCliente(uid, datos.data.notas, guardia.sesion.uid);
    if (!guardado) return NextResponse.json({ error: "Ese cliente ya no existe." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return errorDelServidor("No pudimos guardar las notas. Inténtalo de nuevo.");
  }
}
