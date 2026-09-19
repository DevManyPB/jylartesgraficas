import type { Rol } from "@jyl/core";

export interface Seccion {
  href: string;
  nombre: string;
  /** Quién la ve. SPEC.md §6.1: el operador no ve finanzas ni configuración. */
  roles: readonly Rol[];
}

const PERSONAL = ["admin", "operador"] as const;
const SOLO_ADMIN = ["admin"] as const;

/**
 * Secciones del panel, en el orden del menú. Se agregan a medida que existen:
 * un enlace a una página que todavía no está sería un callejón sin salida.
 *
 * Esconder la sección del menú es comodidad, no seguridad. Lo que protege es
 * `exigirRol()` en cada Route Handler y la comprobación de cada página.
 */
export const SECCIONES: readonly Seccion[] = [
  { href: "/", nombre: "Tablero", roles: PERSONAL },
  { href: "/pedidos", nombre: "Pedidos", roles: PERSONAL },
  { href: "/inventario", nombre: "Inventario", roles: PERSONAL },
  { href: "/portafolio", nombre: "Portafolio", roles: SOLO_ADMIN },
  { href: "/servicios", nombre: "Servicios", roles: SOLO_ADMIN },
  { href: "/configuracion", nombre: "Configuración", roles: SOLO_ADMIN },
];

export function seccionesPara(rol: Rol): Seccion[] {
  return SECCIONES.filter((seccion) => seccion.roles.includes(rol));
}

/** `/pedidos/abc` está dentro de Pedidos; `/` solo es el Tablero exacto. */
export function estaActiva(seccion: Seccion, ruta: string): boolean {
  return seccion.href === "/" ? ruta === "/" : ruta === seccion.href || ruta.startsWith(`${seccion.href}/`);
}
