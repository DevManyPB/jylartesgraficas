"use client";

import { CATEGORIAS_SERVICIO, NOMBRE_CATEGORIA, type Servicio } from "@jyl/core";

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
            <h3 className="text-sm font-medium text-ink-muted">{NOMBRE_CATEGORIA[categoria]}</h3>
            <div className="mt-3 flex flex-col gap-2">
              {deLaCategoria.map((servicio) => (
                <label
                  key={servicio.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${
                    seleccionado === servicio.id
                      ? "border-accent bg-accent-soft"
                      : "border-border hover:border-border-strong"
                  }`}
                >
                  <input
                    type="radio"
                    name="servicio"
                    value={servicio.id}
                    checked={seleccionado === servicio.id}
                    onChange={() => onSeleccionar(servicio.id)}
                    className="mt-0.5 accent-accent"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{servicio.nombre}</span>
                    {servicio.descripcion && (
                      <span className="mt-1 block text-sm text-ink-muted">
                        {servicio.descripcion}
                      </span>
                    )}
                  </span>
                </label>
              ))}
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
