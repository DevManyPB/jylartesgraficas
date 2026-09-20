import type { MetadataRoute } from "next";
import { SITIO_URL } from "@/lib/sitio";

/**
 * SPEC.md §10. Se cierra lo que no tiene sentido indexar: la cuenta del
 * cliente es privada, el formulario con parámetros genera direcciones
 * repetidas, y `/api` no es contenido. El panel es otra aplicación y se
 * excluye desde la suya.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/mi-cuenta", "/entrar"],
    },
    sitemap: `${SITIO_URL}/sitemap.xml`,
  };
}
