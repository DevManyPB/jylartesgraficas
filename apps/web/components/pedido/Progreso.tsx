"use client";

import { cn } from "@jyl/ui";
import { IconoCheck } from "@/components/iconos/Iconos";

const PASOS = ["Qué necesitas", "Detalles", "Referencias", "Tus datos"] as const;

export const TOTAL_PASOS = PASOS.length;

/**
 * Progreso del pedido — SPEC.md §4.5.
 *
 * Era una barra de cuatro rayas y una línea de texto: decía dónde estabas,
 * pero no dejaba hacer nada. Ahora cada paso ya hecho es un botón para
 * volver, que es lo que la gente intenta cuando quiere corregir algo y antes
 * solo se podía a base de «Atrás».
 *
 * Hacia delante no se puede saltar: cada paso valida lo suyo antes de dejar
 * pasar, y permitir el salto sería colarse esa validación.
 */
export function Progreso({ actual, onIr }: { actual: number; onIr: (paso: number) => void }) {
  return (
    <nav aria-label="Progreso del pedido">
      <ol className="flex items-center gap-1 sm:gap-2">
        {PASOS.map((nombre, indice) => {
          const completado = indice < actual;
          const enCurso = indice === actual;

          return (
            <li key={nombre} className={cn("flex items-center", indice > 0 && "flex-1")}>
              {/* La línea que une un paso con el anterior se rellena cuando
                  el anterior queda hecho: el avance se ve, no se deduce. */}
              {indice > 0 && (
                <span aria-hidden className="mx-1.5 h-px flex-1 bg-border sm:mx-2">
                  <span
                    className={cn(
                      "block h-px origin-left bg-accent transition-transform duration-500 ease-entrada motion-reduce:transition-none",
                      completado || enCurso ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </span>
              )}

              <button
                type="button"
                onClick={() => onIr(indice)}
                disabled={!completado}
                aria-current={enCurso ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full py-1 pl-1 pr-1 text-sm transition-colors sm:pr-3",
                  completado && "cursor-pointer hover:bg-canvas-sunken",
                  !completado && "cursor-default",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                    enCurso && "border-accent bg-accent text-ink-inverted",
                    completado && "border-accent text-accent",
                    !enCurso && !completado && "border-border text-ink-subtle",
                  )}
                >
                  {completado ? <IconoCheck className="h-4 w-4" /> : indice + 1}
                </span>

                {/* El nombre solo cabe en pantallas anchas; en móvil manda el
                    número y el título del propio paso, que está justo debajo. */}
                <span
                  className={cn(
                    "hidden sm:inline",
                    enCurso ? "font-medium text-ink" : completado ? "text-ink-muted" : "text-ink-subtle",
                  )}
                >
                  {nombre}
                </span>
                <span className="sr-only">
                  {nombre}
                  {completado ? " (hecho, pulsa para volver)" : enCurso ? " (en curso)" : " (pendiente)"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-sm text-ink-muted sm:hidden">
        Paso {actual + 1} de {TOTAL_PASOS} · {PASOS[actual]}
      </p>
    </nav>
  );
}
