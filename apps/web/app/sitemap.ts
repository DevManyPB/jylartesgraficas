import type { MetadataRoute } from "next";
import { productosPublicos } from "@/datos/cache";
import { SITIO_URL } from "@/lib/sitio";

export const runtime = "nodejs";

/**
 * SPEC.md §10. Las páginas fijas y la ficha de cada producto publicado, que
 * son las direcciones propias que tiene el sitio. El portafolio se filtra
 * con parámetros sobre una sola página, así que va una vez.
 *
 * Los productos salen de la misma caché que la tienda: generar el sitemap
 * no cuesta lecturas de Firestore aparte.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productos = await productosPublicos();
  const ahora = new Date();

  const fijas: MetadataRoute.Sitemap = ([
    { url: SITIO_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITIO_URL}/portafolio`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITIO_URL}/servicios`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITIO_URL}/tienda`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITIO_URL}/nosotros`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITIO_URL}/contacto`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITIO_URL}/pedido`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITIO_URL}/terminos`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITIO_URL}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ] as const).map((pagina) => ({ ...pagina, lastModified: ahora }));

  return [
    ...fijas,
    ...productos.map((producto) => ({
      url: `${SITIO_URL}/tienda/${producto.slug}`,
      lastModified: ahora,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
