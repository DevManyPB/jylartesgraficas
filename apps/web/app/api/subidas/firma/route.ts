import { CARPETAS } from "@jyl/core";
import { crearPermisoDeSubida, leerConfigCloudinary } from "@jyl/core/server";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const cuerpoSchema = z.object({
  destino: z.enum(["pedidos", "portafolio", "productos"]),
});

/**
 * Firma la subida de **un** archivo — AGENTS.md §5: siempre firmada desde el
 * servidor, nunca un preset sin firmar abierto al público.
 *
 * La carpeta y el public_id los decide este endpoint: si los eligiera el
 * navegador, alguien podría sobrescribir un asset que ya existe.
 *
 * Es público a propósito: un invitado tiene que poder adjuntar referencias sin
 * cuenta (SPEC.md §4.5). El freno al abuso son las reglas de rate limiting de
 * Cloudflare (SPEC.md §2.4), no un contador en Firestore: un contador gastaría
 * la misma cuota que pretende proteger.
 */
export async function POST(request: Request) {
  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Destino de subida inválido." }, { status: 400 });
  }

  try {
    const { cloudName, apiKey, apiSecret } = leerConfigCloudinary();

    const permiso = crearPermisoDeSubida({
      cloudName,
      apiKey,
      apiSecret,
      folder: CARPETAS[datos.data.destino],
      publicId: randomUUID(),
    });

    return NextResponse.json(permiso);
  } catch {
    return NextResponse.json({ error: "No pudimos preparar la subida." }, { status: 500 });
  }
}
