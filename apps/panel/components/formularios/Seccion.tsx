import type { ReactNode } from "react";

/**
 * Un bloque de formulario con título. En escritorio el título va a la
 * izquierda y los campos a la derecha, para que una página larga de ajustes
 * se pueda recorrer leyendo solo la columna de títulos.
 */
export function Seccion({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="grid gap-4 border-t border-border pt-6 lg:grid-cols-[14rem_1fr] lg:gap-8">
      <div>
        <legend className="float-left font-display text-base text-ink">{titulo}</legend>
        {descripcion && <p className="clear-left pt-1 text-xs text-ink-muted">{descripcion}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </fieldset>
  );
}
