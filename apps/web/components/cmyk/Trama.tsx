import { cn } from "@jyl/ui";
import { useId } from "react";

/** Las tintas de proceso, como clases enteras para que Tailwind las vea. */
const RELLENO = {
  cian: "fill-tinta-cian",
  magenta: "fill-accent",
  amarillo: "fill-tinta-amarillo",
  negro: "fill-ink",
} as const;

export type Tinta = keyof typeof RELLENO;

interface TramaProps {
  tinta: Tinta;
  className?: string;
  /** Distancia entre puntos, en píxeles: la «lineatura» de la trama. */
  paso?: number;
  /** Radio de cada punto, en píxeles. */
  radio?: number;
}

/**
 * Trama de semitono — SPEC.md §9: puntos de una sola tinta, alternados en
 * cada fila como en una impresión ampliada con lupa.
 *
 * Es un patrón SVG y no un degradado (AGENTS.md §8). Rellena la caja que le
 * den, así que se usa como fondo de una pastilla, de un icono o de un bloque.
 */
export function Trama({ tinta, className, paso = 6, radio = 1.4 }: TramaProps) {
  const id = `trama-${useId().replace(/:/g, "")}`;
  return (
    <svg aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id={id} width={paso} height={paso * 2} patternUnits="userSpaceOnUse">
          <circle cx={paso / 2} cy={paso / 2} r={radio} className={RELLENO[tinta]} />
          <circle cx={0} cy={paso * 1.5} r={radio} className={RELLENO[tinta]} />
          <circle cx={paso} cy={paso * 1.5} r={radio} className={RELLENO[tinta]} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
