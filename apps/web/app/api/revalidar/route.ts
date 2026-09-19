import { ETIQUETAS_CACHE, secretoValido } from "@jyl/core/server";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const cuerpoSchema = z.object({
  etiquetas: z.array(z.enum(ETIQUETAS_CACHE)).min(1).max(ETIQUETAS_CACHE.length),
});

/**
 * Lo llama el panel después de guardar, para que el cambio se vea ya en el
 * sitio y no cuando caduque la caché. Protegido con un secreto compartido
 * que solo conocen los dos servidores (REVALIDACION_SECRETO); sin él, 401.
 */
export async function POST(request: Request) {
  const autorizacion = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretoValido(autorizacion, process.env.REVALIDACION_SECRETO)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const datos = cuerpoSchema.safeParse(await request.json().catch(() => null));
  if (!datos.success) {
    return NextResponse.json({ error: "Etiquetas inválidas." }, { status: 400 });
  }

  // `expire: 0`: la próxima visita ya ve lo nuevo, sin servir antes lo viejo.
  for (const etiqueta of datos.data.etiquetas) revalidateTag(etiqueta, { expire: 0 });
  return NextResponse.json({ ok: true, etiquetas: datos.data.etiquetas });
}
