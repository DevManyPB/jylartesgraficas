"use client";

import { cn } from "@jyl/ui";
import Link, { useLinkStatus } from "next/link";

/**
 * Las pastillas de filtro del portafolio y de la tienda.
 *
 * Filtrar es una navegación al servidor, que en una conexión lenta tarda lo
 * suyo. Sin señal, la pastilla parece rota y se toca dos veces. `useLinkStatus`
 * marca la que se está cargando desde el primer toque, y lo hace sin cambiar
 * el tamaño de nada: solo el color y el pulso de la propia pastilla, para que
 * la fila no salte mientras se espera.
 */

export interface Filtro {
  href: string;
  nombre: string;
  activo: boolean;
}

function Pastilla({ nombre, activo }: { nombre: string; activo: boolean }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-busy={pending || undefined}
      className={cn(
        "block rounded-full border px-4 py-1.5 text-sm transition-colors",
        activo
          ? "border-ink bg-ink text-ink-inverted"
          : "border-border text-ink-muted group-hover:border-border-strong group-hover:text-ink",
        pending && "motion-safe:animate-pulse",
        pending && !activo && "border-accent text-accent",
      )}
    >
      {nombre}
    </span>
  );
}

export function Filtros({
  etiqueta,
  filtros,
  /** Para una segunda fila de filtros, que va pegada a la anterior. */
  seguido,
}: {
  etiqueta: string;
  filtros: Filtro[];
  seguido?: boolean;
}) {
  return (
    <nav aria-label={etiqueta} className={seguido ? "mt-3" : "mt-8"}>
      <ul className="flex flex-wrap gap-2">
        {filtros.map((filtro) => (
          <li key={filtro.href}>
            <Link
              href={filtro.href}
              aria-current={filtro.activo ? "page" : undefined}
              className="group block rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Pastilla nombre={filtro.nombre} activo={filtro.activo} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
