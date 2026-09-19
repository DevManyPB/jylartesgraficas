import { cookieDeCierre, crearCookieSesion } from "@jyl/core/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// firebase-admin es Node, no corre en el runtime Edge.
export const runtime = "nodejs";

const cuerpoSchema = z.object({ idToken: z.string().min(1) });

export async function POST(request: Request) {
  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Falta el token de acceso." }, { status: 400 });
  }

  try {
    const cookie = await crearCookieSesion(datos.data.idToken);
    (await cookies()).set(cookie.nombre, cookie.valor, cookie.opciones);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No pudimos iniciar la sesión." }, { status: 401 });
  }
}

export async function DELETE() {
  const cookie = cookieDeCierre();
  (await cookies()).set(cookie.nombre, cookie.valor, cookie.opciones);
  return NextResponse.json({ ok: true });
}
