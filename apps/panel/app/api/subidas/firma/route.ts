import { CARPETAS } from "@jyl/core";
import { crearPermisoDeSubida, leerConfigCloudinary } from "@jyl/core/server";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

const cuerpoSchema = z.object({ destino: z.enum(["productos", "portafolio"]) });

/**
 * Firma subidas del panel: fotos de productos y del portafolio. Solo admin,
 * que es quien edita la tienda y el portafolio (SPEC.md §6.7). La carpeta y
 * el public_id los pone el servidor, igual que en el sitio público.
 */
export async function POST(request: Request) {
  const guardia = await exigirRol(["admin"]);
  if (!guardia.ok) return guardia.respuesta;

  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) return NextResponse.json({ error: "Destino de subida inválido." }, { status: 400 });

  try {
    const { cloudName, apiKey, apiSecret } = leerConfigCloudinary();
    return NextResponse.json(
      crearPermisoDeSubida({
        cloudName,
        apiKey,
        apiSecret,
        folder: CARPETAS[datos.data.destino],
        publicId: randomUUID(),
      }),
    );
  } catch {
    return NextResponse.json({ error: "No pudimos preparar la subida." }, { status: 500 });
  }
}
