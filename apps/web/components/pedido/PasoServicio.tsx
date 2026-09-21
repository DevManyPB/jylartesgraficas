"use client";

import { CATEGORIAS_SERVICIO, NOMBRE_CATEGORIA, type Servicio } from "@jyl/core";
import { cn } from "@jyl/ui";
import type { ReactNode } from "react";
import { IconoCheck, IconoCodigo, IconoLlave, IconoPincel } from "@/components/iconos/Iconos";

/** El mismo icono que identifica cada área en el inicio y en Servicios. */
const ICONO_CATEGORIA: Record<(typeof CATEGORIAS_SERVICIO)[number], ReactNode> = {
  publicidad: <IconoPincel className="h-4 w-4" />,
  web: <IconoCodigo className="h-4 w-4" />,
  tecnico: <IconoLlave className="h-4 w-4" />,
};

interface PasoServicioProps {
  servicios: Servicio[];
  seleccionado: string | null;
  onSeleccionar: (id: string) => void;
  error?: string;
}

/** Paso 1 — SPEC.md §4.5. */
export function PasoServicio({
  servicios,
  seleccionado,
  onSeleccionar,
  error,
}: PasoServicioProps) {
  return (
    <fieldset>
      <legend className="font-display text-2xl text-ink">¿Qué necesitas?</legend>
      <p className="mt-2 text-sm text-ink-muted">
        Elige el servicio que más se acerque. En el siguiente paso nos cuentas los detalles.
      </p>

      {CATEGORIAS_SERVICIO.map((categoria) => {
        const deLaCategoria = servicios.filter((s) => s.categoria === categoria);
        if (deLaCategoria.length === 0) return null;

        return (
          <div key={categoria} className="mt-8">
            <h3 className="flex items-center gap-2 text-sm font-medium text-ink-muted">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                {ICONO_CATEGORIA[categoria]}
              </span>
              {NOMBRE_CATEGORIA[categoria]}
            </h3>

            {/* En dos columnas: catorce servicios en una sola columna eran
                una lista larguísima que obligaba a bajar para ver el área
                siguiente. El radio nativo sigue debajo, oculto, para no
                perder teclado ni lector de pantalla. */}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {deLaCategoria.map((servicio) => {
                const elegido = seleccionado === servicio.id;
                return (
                  <label
                    key={servicio.id}
                    className={cn(
                      "group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200",
                      "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                      elegido
                        ? "border-accent bg-accent-soft shadow-sm"
                        : "border-border hover:border-border-strong hover:bg-canvas-sunken",
                    )}
                  >
                    <input
                      type="radio"
                      name="servicio"
                      value={servicio.id}
                      checked={elegido}
                      onChange={() => onSeleccionar(servicio.id)}
                      className="sr-only"
                    />
                    {/* Marca de elegido dibujada a mano: el radio del sistema
                        no se puede animar ni teñir con el acento. */}
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        elegido ? "border-accent bg-accent text-ink-inverted" : "border-border-strong",
                      )}
                    >
                      <IconoCheck
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none",
                          elegido ? "scale-100" : "scale-0",
                        )}
                      />
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink">{servicio.nombre}</span>
                      {servicio.descripcion && (
                        <span className="mt-1 block text-sm text-ink-muted">
                          {servicio.descripcion}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {error && (
        <p role="alert" aria-live="polite" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
