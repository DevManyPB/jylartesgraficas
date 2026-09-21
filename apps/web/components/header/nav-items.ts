/**
 * Cuatro destinos como máximo — SPEC.md §4.2.
 * El resto de enlaces vive en el pie de página.
 */
export const navItems = [
  { href: "/portafolio", label: "Portafolio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/tienda", label: "Tienda" },
  { href: "/contacto", label: "Contacto" },
] as const;

/**
 * Ya no hay acción de acento en el header: «Pedir un trabajo» aparece en el
 * héroe, en cada servicio, en cada producto, en el menú de la cuenta y en el
 * pie, así que repetirlo también arriba solo restaba sitio. El acento del
 * header es ahora «Entrar», que es lo único que no estaba en ninguna parte.
 */
