/**
 * "Afiches y pósters" → "afiches-y-posters". Es la misma regla con la que se
 * sembró el catálogo (scripts/seed-servicios.mjs), para que un servicio creado
 * desde el panel y uno sembrado tengan identificadores del mismo estilo.
 */
export function slugDe(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
