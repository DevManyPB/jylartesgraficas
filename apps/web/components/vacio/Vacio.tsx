import type { ReactNode } from "react";

/**
 * Pantalla vacía — AGENTS.md §8: nunca una pantalla en blanco, y siempre con
 * una salida. Antes eran un párrafo gris dentro de una caja: se leían como un
 * error. Con un icono, una frase corta y un botón, se leen como "todavía no,
 * pero puedes hacer esto".
 */
export function Vacio({
  icono,
  titulo,
  children,
  accion,
}: {
  icono: ReactNode;
  titulo: string;
  /** Una frase. Si hace falta un párrafo, es que el título está mal escrito. */
  children?: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border bg-canvas-sunken px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-ink-subtle">
        {icono}
      </span>
      <p className="mt-4 font-display text-xl text-ink">{titulo}</p>
      {children && <p className="mt-2 max-w-sm text-sm text-ink-muted">{children}</p>}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}
