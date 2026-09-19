import "server-only";

import { borrarSubida, verificarSubida } from "../cloudinary/verificar";

import type { ImagenGuardada } from "./tipos";

export type { ImagenGuardada };

/** Formatos que sirven como foto de producto o de portafolio. */
const FORMATOS_DE_FOTO = new Set(["jpg", "jpeg", "png", "webp"]);

/** Algo del catálogo no se pudo guardar por una razón que el admin tiene que leer. */
export class ErrorDeCatalogo extends Error {}

const txt = (v: unknown) => (typeof v === "string" ? v : "");
const numONulo = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function aImagenes(v: unknown): ImagenGuardada[] {
  if (!Array.isArray(v)) return [];
  return v.map((i: Record<string, unknown>) => ({
    publicId: txt(i.publicId),
    url: txt(i.url),
    ancho: numONulo(i.ancho),
    alto: numONulo(i.alto),
    alt: txt(i.alt),
  }));
}

/**
 * Deja cada imagen verificada contra Cloudinary. Las que ya estaban guardadas
 * no se vuelven a consultar; las nuevas sí, y se rechazan si no son una foto.
 * Guarda ancho y alto reales: el sitio los usa para reservar el espacio y
 * para que cada pieza conserve su proporción (AGENTS.md §8).
 */
export async function resolverImagenes(
  entrantes: { publicId: string; alt: string }[],
  actuales: ImagenGuardada[],
): Promise<ImagenGuardada[]> {
  const conocidas = new Map(actuales.map((i) => [i.publicId, i]));
  return Promise.all(
    entrantes.map(async ({ publicId, alt }) => {
      const conocida = conocidas.get(publicId);
      if (conocida) return { ...conocida, alt };

      const resultado = await verificarSubida(publicId, "image");
      if (!resultado.ok) throw new ErrorDeCatalogo(resultado.problema.mensaje);
      if (!FORMATOS_DE_FOTO.has(resultado.archivo.formato)) {
        await borrarSubida(publicId, "image");
        throw new ErrorDeCatalogo("Las fotos tienen que ser JPG, PNG o WEBP.");
      }
      const { url, ancho, alto } = resultado.archivo;
      return { publicId, url, ancho, alto, alt };
    }),
  );
}

/** Borra de Cloudinary las imágenes que ya no se usan. Nunca hace fallar el guardado. */
export async function borrarImagenesSobrantes(antes: ImagenGuardada[], despues: ImagenGuardada[]): Promise<void> {
  const siguen = new Set(despues.map((i) => i.publicId));
  await Promise.allSettled(
    antes.filter((i) => !siguen.has(i.publicId)).map((i) => borrarSubida(i.publicId, "image")),
  );
}

export async function borrarImagenes(imagenes: ImagenGuardada[]): Promise<void> {
  await Promise.allSettled(imagenes.map((i) => borrarSubida(i.publicId, "image")));
}
