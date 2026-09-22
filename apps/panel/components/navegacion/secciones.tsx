import type { Rol } from "@jyl/core";
import type { ReactNode } from "react";
import {
  IconoClientes,
  IconoConfiguracion,
  IconoFacturas,
  IconoInventario,
  IconoPedidos,
  IconoPortafolio,
  IconoServicios,
  IconoTablero,
} from "@/components/iconos/Iconos";

export interface Seccion {
  href: string;
  nombre: string;
  icono: ReactNode;
  /** Quién la ve. SPEC.md §6.1: el operador no ve finanzas ni configuración. */
  roles: readonly Rol[];
}

export interface GrupoDeSecciones {
  /** null para el primer grupo: el tablero no necesita epígrafe. */
  nombre: string | null;
  secciones: readonly Seccion[];
}

const PERSONAL = ["admin", "operador"] as const;
const SOLO_ADMIN = ["admin"] as const;

/**
 * Secciones del panel, agrupadas por para qué se entra.
 *
 * Ocho enlaces seguidos son ocho palabras que hay que leer enteras cada vez
 * para encontrar una. Agrupadas por tarea —lo del día a día, el catálogo que
 * se publica, el dinero— se recorren de un vistazo, y el icono deja
 * reconocer cada una por su forma sin llegar a leerla.
 *
 * Se agregan a medida que existen: un enlace a una página que todavía no
 * está sería un callejón sin salida.
 *
 * Esconder la sección del menú es comodidad, no seguridad. Lo que protege es
 * `exigirRol()` en cada Route Handler y la comprobación de cada página.
 */
export const GRUPOS: readonly GrupoDeSecciones[] = [
  {
    nombre: null,
    secciones: [{ href: "/", nombre: "Tablero", icono: <IconoTablero />, roles: PERSONAL }],
  },
  {
    nombre: "El día a día",
    secciones: [
      { href: "/pedidos", nombre: "Pedidos", icono: <IconoPedidos />, roles: PERSONAL },
      { href: "/inventario", nombre: "Inventario", icono: <IconoInventario />, roles: PERSONAL },
    ],
  },
  {
    nombre: "Dinero",
    secciones: [
      { href: "/facturas", nombre: "Facturas", icono: <IconoFacturas />, roles: SOLO_ADMIN },
      { href: "/clientes", nombre: "Clientes", icono: <IconoClientes />, roles: SOLO_ADMIN },
    ],
  },
  {
    nombre: "Lo que ve el público",
    secciones: [
      { href: "/portafolio", nombre: "Portafolio", icono: <IconoPortafolio />, roles: SOLO_ADMIN },
      { href: "/servicios", nombre: "Servicios", icono: <IconoServicios />, roles: SOLO_ADMIN },
      { href: "/configuracion", nombre: "Configuración", icono: <IconoConfiguracion />, roles: SOLO_ADMIN },
    ],
  },
];

/** Los grupos que le quedan a un rol, sin los que se quedan vacíos. */
export function gruposPara(rol: Rol): GrupoDeSecciones[] {
  return GRUPOS.map((grupo) => ({
    ...grupo,
    secciones: grupo.secciones.filter((seccion) => seccion.roles.includes(rol)),
  })).filter((grupo) => grupo.secciones.length > 0);
}

/** `/pedidos/abc` está dentro de Pedidos; `/` solo es el Tablero exacto. */
export function estaActiva(seccion: Seccion, ruta: string): boolean {
  return seccion.href === "/" ? ruta === "/" : ruta === seccion.href || ruta.startsWith(`${seccion.href}/`);
}
