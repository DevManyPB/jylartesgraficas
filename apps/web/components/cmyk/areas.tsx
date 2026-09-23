import type { CATEGORIAS_SERVICIO } from "@jyl/core";
import { cn } from "@jyl/ui";
import type { ReactNode } from "react";
import { IconoCodigo, IconoLlave, IconoPincel } from "@/components/iconos/Iconos";
import { Trama, type Tinta } from "./Trama";

type Area = (typeof CATEGORIAS_SERVICIO)[number];

/**
 * Cada área de servicio tiene su tinta de proceso — SPEC.md §9: publicidad y
 * diseño en magenta, desarrollo web en cian, servicios técnicos en amarillo.
 * Así un área se reconoce por el color antes de leerla. Es color gráfico, no
 * de texto: nunca se escribe en cian ni en amarillo.
 */
export const TINTA_AREA: Record<Area, Tinta> = {
  publicidad: "magenta",
  web: "cian",
  tecnico: "amarillo",
};

/**
 * La clase que fija `--tinta` al color del área, para las reglas de
 * globals.css que la usan (la sombra de plancha de `FilaServicio`). Enteras,
 * para que Tailwind y el CSS las encuentren.
 */
export const CLASE_TINTA: Record<Tinta, string> = {
  cian: "tinta-cian",
  magenta: "tinta-magenta",
  amarillo: "tinta-amarillo",
  negro: "tinta-negro",
};

const ICONO_AREA: Record<Area, (clase: string) => ReactNode> = {
  publicidad: (clase) => <IconoPincel className={clase} />,
  web: (clase) => <IconoCodigo className={clase} />,
  tecnico: (clase) => <IconoLlave className={clase} />,
};

/**
 * El icono del área sobre una pastilla de trama en su tinta. Sustituye al
 * círculo rosado que llevaban las tres áreas por igual: ahora cada una se
 * distingue, y la trama dice «imprenta» sin una palabra.
 *
 * El icono va en negro sobre un disco claro, para que se lea encima de los
 * puntos sea cual sea la tinta.
 */
export function PastillaArea({ area, className }: { area: Area; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border",
        className ?? "h-9 w-9",
      )}
    >
      <Trama tinta={TINTA_AREA[area]} paso={5} radio={1.3} />
      <span className="relative flex h-[55%] w-[55%] items-center justify-center rounded-full bg-canvas text-ink">
        {ICONO_AREA[area]("h-3.5 w-3.5")}
      </span>
    </span>
  );
}
