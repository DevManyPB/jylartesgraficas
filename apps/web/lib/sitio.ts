/**
 * La dirección pública del sitio, para los enlaces que tienen que ser
 * absolutos: `sitemap.xml`, `robots.txt`, Open Graph y los datos
 * estructurados (SPEC.md §10).
 *
 * En desarrollo y en una vista previa se pasa por `SITIO_URL`; si no está,
 * se usa el dominio del proyecto (SPEC.md §1).
 */
export const SITIO_URL = (process.env.SITIO_URL ?? "https://jylartesgraficos.com").replace(/\/$/, "");
