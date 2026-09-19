import { insumoEditableSchema } from "@jyl/core";
import { crearInsumo } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { datosInvalidos, errorDelServidor } from "@/servidor/respuestas";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const cuerpoSchema = z.intersection(
  insumoEditableSchema,
  z.object({ stockInicial: z.number().int().nonnegative().default(0) }),
);

/** Crea un insumo (tinta, papel, vinilo) — SPEC.md §6.4. Solo admin. */
export async function POST(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return datosInvalidos(datos.error);

  try {
    const { stockInicial, ...insumo } = datos.data;
    const id = await crearInsumo(insumo, stockInicial, guardia.sesion.uid);
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return errorDelServidor("No pudimos crear el insumo. Inténtalo de nuevo.");
  }
}
