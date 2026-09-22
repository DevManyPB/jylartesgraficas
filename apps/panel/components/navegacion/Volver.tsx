"use client";

import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";

/**
 * «Volver a Pedidos» en las pantallas de detalle.
 *
 * Antes cada una de las doce llevaba el mismo enlace suelto, en gris y en
 * tamaño pequeño, con solo el nombre de la sección: «Facturas». Leído así no
 * parece una salida, parece un título. Para quien no da por hecho que el
 * texto de arriba a la izquierda es un botón de volver, no existía.
 *
 * Tres cambios y ninguno es decorativo: dice el verbo («Volver a»), lleva
 * flecha, y tiene el área pulsable de un botón en vez de la de una línea de
 * texto de doce píxeles.
 *
 * Sigue siendo un `EnlaceProtegido`: si hay cambios sin guardar en la
 * pantalla, avisa antes de salir (SPEC.md §5.1). Esa es la razón de envolver
 * el enlace del panel y no usar un `Link` normal.
 */
export function Volver({ href, children }: { href: string; children: string }) {
  return (
    <EnlaceProtegido
      href={href}
      className="-ml-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M19 12H5" />
        <path d="m11 6-6 6 6 6" />
      </svg>
      Volver a {children}
    </EnlaceProtegido>
  );
}
