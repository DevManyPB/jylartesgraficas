import { cn } from "@jyl/ui";

/**
 * Barra fija al pie que aparece solo cuando hay cambios. Así el botón de
 * guardar está siempre a mano en un formulario largo, y cuando no hay nada
 * que guardar no ocupa sitio ni invita a pulsarlo.
 */
export function BarraGuardar({
  visible,
  guardando,
  etiqueta = "Guardar cambios",
}: {
  visible: boolean;
  guardando: boolean;
  etiqueta?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-canvas/95 backdrop-blur lg:left-56",
        "transition-transform duration-200 motion-reduce:transition-none",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
      // Fuera de pantalla no debe recibir foco con el tabulador.
      inert={!visible}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <p role="status" className="text-sm text-ink-muted">
          {visible ? "Tienes cambios sin guardar." : ""}
        </p>
        <button
          type="submit"
          disabled={guardando}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {guardando ? "Guardando…" : etiqueta}
        </button>
      </div>
    </div>
  );
}
