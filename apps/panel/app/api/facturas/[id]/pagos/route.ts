import { pagoSchema } from "@jyl/core";
import { registrarPago } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Registra un pago parcial o total (SPEC.md §6.5). */
export async function POST(request: Request, ctx: RouteContext<"/api/facturas/[id]/pagos">) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const { id } = await ctx.params;
  const datos = pagoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const r = await registrarPago(id, datos.data, guardia.sesion.uid);
    if (!r.ok) {
      // El único rechazo que depende del monto se muestra junto al campo.
      return NextResponse.json({ error: r.mensaje, campos: { monto: r.mensaje } }, { status: r.estado });
    }
    return NextResponse.json({ saldo: r.saldo });
  } catch {
    return errorDelServidor("No pudimos registrar el pago. Inténtalo de nuevo.");
  }
}
