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

export const primaryAction = { href: "/pedido", label: "Pedir un trabajo" } as const;
