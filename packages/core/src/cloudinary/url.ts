/**
 * URLs de entrega. AGENTS.md §5: las transformaciones se piden por URL y
 * siempre con formato y calidad automáticos, para que Cloudinary sirva
 * AVIF/WEBP y no se quemen créditos del plan gratuito.
 */

export interface OpcionesDeImagen {
  /** Ancho en píxeles. Sin él, se sirve al tamaño original. */
  ancho?: number;
  alto?: number;
  /** Recorte. Por defecto `limit`: nunca agranda ni deforma. */
  modo?: "limit" | "fill" | "fit";
}

export function urlDeImagen(
  cloudName: string,
  publicId: string,
  opciones: OpcionesDeImagen = {},
): string {
  const transformaciones = ["f_auto", "q_auto"];

  if (opciones.ancho) transformaciones.push(`w_${opciones.ancho}`);
  if (opciones.alto) transformaciones.push(`h_${opciones.alto}`);
  if (opciones.ancho || opciones.alto) transformaciones.push(`c_${opciones.modo ?? "limit"}`);

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformaciones.join(",")}/${publicId}`;
}

/**
 * `srcSet` para imágenes responsive. Junto con `sizes` es lo que pide
 * SPEC.md §10 para que el navegador descargue solo lo que necesita.
 */
export function srcSetDeImagen(
  cloudName: string,
  publicId: string,
  anchos: number[],
  modo?: OpcionesDeImagen["modo"],
): string {
  return anchos
    .map((ancho) => `${urlDeImagen(cloudName, publicId, { ancho, modo })} ${ancho}w`)
    .join(", ");
}

const SEGMENTO_IMAGEN = "/image/upload/";

/**
 * Miniatura a partir de la `url` guardada de un archivo. Cloudinary rasteriza
 * la primera página de un PDF, un AI o un PSD cuando se le pide una imagen,
 * así que también esos tienen vista previa sin guardar nada aparte.
 *
 * Devuelve null si el archivo no es de tipo imagen para Cloudinary (quedó
 * como `raw`): de esos no hay vista previa posible.
 */
export function miniaturaDesdeUrl(
  url: string,
  lado: number,
  /** "fill": cuadrado recortado, para cuadrículas. "limit": entera, para el visor. */
  modo: "fill" | "limit" = "fill",
): string | null {
  if (!url.includes(SEGMENTO_IMAGEN)) return null;
  const [antes, despues] = url.split(SEGMENTO_IMAGEN) as [string, string];
  // Se pide JPG/WEBP de la primera página: `pg_1` solo afecta a documentos.
  return `${antes}${SEGMENTO_IMAGEN}f_auto,q_auto,pg_1,w_${lado},h_${lado},c_${modo}/${despues.replace(/\.(pdf|ai|psd)$/i, ".jpg")}`;
}

/**
 * URL que descarga el archivo original en vez de abrirlo en el navegador.
 * `fl_attachment` solo existe para imágenes; un `raw` ya se descarga solo.
 */
export function urlDeDescarga(url: string): string {
  if (!url.includes(SEGMENTO_IMAGEN)) return url;
  return url.replace(SEGMENTO_IMAGEN, `${SEGMENTO_IMAGEN}fl_attachment/`);
}
