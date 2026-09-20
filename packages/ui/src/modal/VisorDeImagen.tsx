"use client";

import { Modal } from "./Modal";

export interface VisorDeImagenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Título del modal: el nombre de la pieza o del archivo. */
  titulo: string;
  src: string;
  alt: string;
  /** Si se da, aparece un enlace para descargar el original. */
  descarga?: { href: string; etiqueta: string };
  /** Texto breve bajo la imagen: formato, peso, dimensiones… */
  pie?: string;
  /**
   * Para recorrer un conjunto — las fotos de un proyecto, p. ej. Aparecen
   * las flechas y funcionan también con las teclas ← y →.
   */
  navegacion?: {
    onAnterior: () => void;
    onSiguiente: () => void;
    /** "2 de 5", para quien no ve las flechas. */
    posicion: string;
  };
}

/**
 * Ver una imagen a tamaño completo — SPEC.md §5.1. La imagen conserva su
 * proporción real (AGENTS.md §8: nunca recortar una pieza) y nunca pasa del
 * alto de la pantalla, para que siempre quepa entera con sus controles.
 */
export function VisorDeImagen({ open, onOpenChange, titulo, src, alt, descarga, pie, navegacion }: VisorDeImagenProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="visor">
      <div
        onKeyDown={(evento) => {
          if (!navegacion) return;
          if (evento.key === "ArrowLeft") navegacion.onAnterior();
          if (evento.key === "ArrowRight") navegacion.onSiguiente();
        }}
        className="flex flex-col gap-3 p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <Modal.Title className="min-w-0 truncate font-display text-base text-ink">{titulo}</Modal.Title>
          <Modal.Close aria-label="Cerrar" className="shrink-0 text-ink-subtle transition hover:text-ink">
            ✕
          </Modal.Close>
        </div>

        <Modal.Description className="sr-only">{alt}</Modal.Description>

        <div className="relative flex justify-center rounded-lg bg-canvas-sunken">
          {/* <img> y no next/image: packages/ui no depende de Next, y la URL
              ya llega transformada por Cloudinary con formato automático. */}
          <img src={src} alt={alt} className="max-h-[75vh] w-auto max-w-full object-contain" />

          {navegacion && (
            <>
              <button
                type="button"
                onClick={navegacion.onAnterior}
                aria-label="Ver la anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-canvas/90 px-3 py-2 text-ink shadow-sm transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={navegacion.onSiguiente}
                aria-label="Ver la siguiente"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-canvas/90 px-3 py-2 text-ink shadow-sm transition hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                ›
              </button>
            </>
          )}
        </div>

        {navegacion && (
          <p aria-live="polite" className="text-center text-xs text-ink-muted">
            {navegacion.posicion}
          </p>
        )}

        {(pie || descarga) && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            {pie && <p className="text-ink-muted">{pie}</p>}
            {descarga && (
              <a
                href={descarga.href}
                className="rounded-md border border-border-strong px-3 py-1.5 font-medium text-ink transition-colors hover:bg-canvas-sunken"
              >
                {descarga.etiqueta}
              </a>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
