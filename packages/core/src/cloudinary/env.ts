import "server-only";

import { z } from "zod";

const schema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export type ConfigCloudinary = z.infer<typeof schema>;

/**
 * El API secret firma subidas y permite borrar: solo servidor, y por eso este
 * módulo lleva `server-only` y ninguna variable usa el prefijo NEXT_PUBLIC_.
 */
export function leerConfigCloudinary(): ConfigCloudinary {
  const resultado = schema.safeParse({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  });

  if (!resultado.success) {
    const faltantes = resultado.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Falta configuración de Cloudinary (${faltantes}). Cópiala desde la consola a .env.local.`,
    );
  }

  return resultado.data;
}
