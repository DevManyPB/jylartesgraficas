import { cn } from "@jyl/ui";
import type { SVGProps } from "react";

/**
 * Iconos del panel: uno por sección.
 *
 * Mismo trazo que los del sitio público (1,5 sobre rejilla de 24, heredando
 * `currentColor`), pero juego propio: las secciones del panel no son las del
 * sitio y compartir el archivo obligaría a subir los iconos a `packages/ui`,
 * que hoy solo tiene modales y toasts.
 *
 * Aquí el icono no es decoración: en una lista de ocho palabras sueltas, la
 * forma es lo que deja encontrar la sección sin leerlas todas. Va siempre
 * acompañando al nombre, nunca solo.
 */

type IconoProps = SVGProps<SVGSVGElement>;

function Icono({ children, className, ...props }: IconoProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[18px] w-[18px] shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoTablero(props: IconoProps) {
  return (
    <Icono {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
    </Icono>
  );
}

export function IconoPedidos(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M5 7.5h14l-1 12.5H6Z" />
      <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
    </Icono>
  );
}

export function IconoInventario(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M3.5 8.5 12 4l8.5 4.5v7L12 20l-8.5-4.5Z" />
      <path d="M3.5 8.5 12 13l8.5-4.5M12 13v7" />
    </Icono>
  );
}

export function IconoFacturas(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M6 3v18l2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4V3l-2 1.4L14 3l-2 1.4L10 3 8 4.4Z" />
      <path d="M9.5 9h5M9.5 13h5" />
    </Icono>
  );
}

export function IconoClientes(props: IconoProps) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </Icono>
  );
}

export function IconoPortafolio(props: IconoProps) {
  return (
    <Icono {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m4 17 4.5-4.5 3 3L15 11l5 5" />
    </Icono>
  );
}

export function IconoServicios(props: IconoProps) {
  return (
    <Icono {...props}>
      <path d="M14.5 3.5 20.5 9.5 10 20H4v-6Z" />
      <path d="m12.5 5.5 6 6" />
    </Icono>
  );
}

export function IconoConfiguracion(props: IconoProps) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M18 6l-1.4 1.4M7.4 16.6 6 18M18 18l-1.4-1.4M7.4 7.4 6 6" />
    </Icono>
  );
}
