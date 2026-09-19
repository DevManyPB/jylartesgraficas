import { borradorFacturaSchema } from "@jyl/core";
import { crearBorrador } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { datosInvalidos, errorDelServidor, rechazo } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/** Crea una factura en borrador — SPEC.md §6.5. Solo admin: el operador no ve finanzas (§6.1). */
export async function POST(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = borradorFacturaSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const r = await crearBorrador(datos.data, guardia.sesion.uid);
    return r.ok ? NextResponse.json({ id: r.id }, { status: 201 }) : rechazo(r);
  } catch {
    return errorDelServidor("No pudimos guardar la factura. Inténtalo de nuevo.");
  }
}
