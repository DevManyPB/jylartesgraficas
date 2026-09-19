import { rolSchema } from "@jyl/core";
import { getFirebaseAdmin } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const cuerpoSchema = z.object({
  uid: z.string().min(1),
  rol: rolSchema,
});

/**
 * Asigna el rol como custom claim y lo refleja en users/{uid}.role
 * (SPEC.md §6.1). No hay Cloud Functions, así que esto vive aquí.
 * El rol nunca se escribe desde el cliente: las reglas lo impiden y este
 * endpoint exige ser admin.
 */
export async function POST(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const { uid, rol } = datos.data;
  const { auth, db } = getFirebaseAdmin();

  await auth.setCustomUserClaims(uid, { role: rol });
  await db.collection("users").doc(uid).set({ role: rol }, { merge: true });

  // Invalida las sesiones abiertas: el token viejo todavía lleva el rol
  // anterior y seguiría valiendo hasta caducar.
  await auth.revokeRefreshTokens(uid);

  return NextResponse.json({ ok: true });
}
