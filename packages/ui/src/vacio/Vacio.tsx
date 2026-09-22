import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/**
 * Pantalla vacía — AGENTS.md §9: «estados de vacío diseñados, nunca una
 * pantalla en blanco; la pantalla vacía invita a actuar».
 *
 * Un párrafo gris suelto se lee como un error. Con un icono, una frase corta
 * y una salida, se lee como «todavía no, pero puedes hacer esto».
 *
 * Vive aquí y no en una app porque la usan las dos (AGENTS.md §3). El icono
 * y la acción los pone quien la usa: cada app tiene los suyos.
 */
export function Vacio({
  icono,
  titulo,
  children,
  accion,
  compacto = false,
}: {
  icono: ReactNode;
  titulo: string;
  /** Una frase. Si hace falta un párrafo, es que el título está mal escrito. */
  children?: ReactNode;
  accion?: ReactNode;
  /**
   * Para el panel, que pide densidad sobre aire (SPEC.md §9): el mismo
   * mensaje ocupando menos, porque ahí se entra a trabajar.
   */
  compacto?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border bg-canvas-sunken px-6 text-center",
        compacto ? "mt-4 py-10" : "mt-12 py-14",
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-ink-subtle">
        {icono}
      </span>
      <p className={cn("mt-4 font-display text-ink", compacto ? "text-lg" : "text-xl")}>{titulo}</p>
      {children && <p className="mt-2 max-w-sm text-sm text-ink-muted">{children}</p>}
      {accion && <div className={compacto ? "mt-5" : "mt-6"}>{accion}</div>}
    </div>
  );
}
