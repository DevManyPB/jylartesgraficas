"use client";

import { FORMATOS_PERMITIDOS, MAX_ARCHIVOS_POR_PEDIDO } from "@jyl/core";
import { useRef, useState } from "react";
import type { Referencia } from "./use-referencias";

interface PasoReferenciasProps {
  referencias: Referencia[];
  onAgregar: (archivos: File[]) => void;
  onQuitar: (id: string) => void;
  /** Lo decide el estudio por servicio desde el panel. Nunca es obligatorio. */
  sugerir: boolean;
}

function pesoLegible(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Paso 3 — SPEC.md §4.5: vista previa, quitar, y progreso real por archivo. */
export function PasoReferencias({ referencias, onAgregar, onQuitar, sugerir }: PasoReferenciasProps) {
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastrando, setArrastrando] = useState(false);

  const lleno = referencias.length >= MAX_ARCHIVOS_POR_PEDIDO;
  const aceptados = FORMATOS_PERMITIDOS.map((f) => `.${f}`).join(",");

  return (
    <fieldset>
      <legend className="font-display text-2xl text-ink">Referencias</legend>
      <p className="mt-2 text-sm text-ink-muted">
        {sugerir
          ? "Si tienes bocetos, logos o ejemplos que te gusten, adjúntalos. Es opcional, pero ayuda mucho."
          : "Para este servicio no suele hacer falta ningún archivo. Si tienes uno que ayude a entender el caso, adjúntalo; si no, continúa."}
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastrando(false);
          if (!lleno) onAgregar(Array.from(e.dataTransfer.files));
        }}
        className={`mt-6 rounded-xl border border-dashed p-6 text-center transition-colors ${
          arrastrando ? "border-accent bg-accent-soft" : "border-border-strong"
        }`}
      >
        <p className="text-sm text-ink-muted">
          Arrastra los archivos aquí, o
        </p>
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={lleno}
          className="mt-3 rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken disabled:pointer-events-none disabled:opacity-50"
        >
          Elegir archivos
        </button>
        {/*
          El control real es el botón de arriba. Este input queda fuera del
          tabulador y del árbol de accesibilidad a propósito: si no, quien
          navega con teclado aterriza en un campo que no ve y que no tiene
          nombre, justo después del botón que hace lo mismo.
        */}
        <input
          ref={entrada}
          type="file"
          multiple
          accept={aceptados}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(e) => {
            onAgregar(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <p className="mt-3 text-xs text-ink-subtle">
          Hasta {MAX_ARCHIVOS_POR_PEDIDO} archivos de 10 MB · {FORMATOS_PERMITIDOS.join(", ")}
        </p>
      </div>

      {lleno && (
        <p role="status" className="mt-3 text-sm text-ink-muted">
          Llegaste al máximo de {MAX_ARCHIVOS_POR_PEDIDO} archivos. Quita alguno si
          necesitas cambiarlo.
        </p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {referencias.map((referencia) => (
          <li
            key={referencia.id}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-canvas-sunken text-xs text-ink-subtle">
              {referencia.vistaPrevia ? (
                // Object URL local: next/image no aporta nada y exigiría configurarlo.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={referencia.vistaPrevia}
                  alt={`Vista previa de ${referencia.nombre}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                (referencia.nombre.split(".").pop() ?? "").toUpperCase()
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{referencia.nombre}</span>

              {referencia.estado === "subiendo" && (
                <>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full bg-accent transition-[width] duration-150"
                      style={{ width: `${referencia.progreso}%` }}
                    />
                  </span>
                  <span
                    role="progressbar"
                    aria-valuenow={referencia.progreso}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Subiendo ${referencia.nombre}`}
                    className="mt-1 block text-xs text-ink-subtle"
                  >
                    {referencia.progreso}%
                  </span>
                </>
              )}

              {referencia.estado === "listo" && (
                <span className="mt-0.5 block text-xs text-success">
                  Listo · {pesoLegible(referencia.bytes)}
                </span>
              )}

              {referencia.estado === "error" && (
                <span role="alert" className="mt-0.5 block text-xs text-danger">
                  {referencia.error}
                </span>
              )}
            </span>

            <button
              type="button"
              onClick={() => onQuitar(referencia.id)}
              aria-label={`Quitar ${referencia.nombre}`}
              className="shrink-0 rounded-md px-2 py-1 text-sm text-ink-subtle transition-colors hover:bg-canvas-sunken hover:text-ink"
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
