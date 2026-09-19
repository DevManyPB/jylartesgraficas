import { cn } from "@jyl/ui";
import { useId, type ReactNode } from "react";

/** Estilo único de las entradas del panel: compactas, como pide SPEC.md §9. */
export const claseEntrada = cn(
  "w-full rounded-md border border-border-strong bg-canvas px-2.5 py-1.5 text-sm text-ink",
  "placeholder:text-ink-subtle outline-none transition-colors",
  "focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent/30",
  "aria-[invalid=true]:border-danger disabled:opacity-60",
);

interface PropsDeEntrada {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface CampoProps {
  etiqueta: string;
  /** Ayuda breve bajo la etiqueta; se anuncia junto con el campo. */
  ayuda?: ReactNode;
  error?: string;
  className?: string;
  /** Para ocultar la etiqueta visualmente donde otra cosa la da, p. ej. la cabecera de una tabla. */
  claseEtiqueta?: string;
  /** Recibe los atributos que conectan la entrada con su etiqueta y su error. */
  children: (props: PropsDeEntrada) => ReactNode;
}

/**
 * Etiqueta, entrada, ayuda y error, enlazados entre sí. El error se asocia
 * con `aria-describedby` y se anuncia al aparecer, así que quien usa lector
 * de pantalla lo oye sin tener que buscarlo.
 */
export function Campo({ etiqueta, ayuda, error, className, claseEtiqueta, children }: CampoProps) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describe = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className={cn("text-[13px] font-medium text-ink", claseEtiqueta)}>
        {etiqueta}
      </label>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": describe })}
      {ayuda && (
        <p id={idAyuda} className="text-xs text-ink-subtle">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Casilla con su texto al lado; el texto es parte de la etiqueta clicable. */
export function Casilla({
  etiqueta,
  ayuda,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  children: (props: { id: string }) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-2">
      {children({ id })}
      <label htmlFor={id} className="text-sm text-ink">
        {etiqueta}
        {ayuda && <span className="block text-xs text-ink-subtle">{ayuda}</span>}
      </label>
    </div>
  );
}
