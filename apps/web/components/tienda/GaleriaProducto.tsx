"use client";

import { miniaturaDesdeUrl, type ImagenGuardada } from "@jyl/core";
import { VisorDeImagen } from "@jyl/ui";
import { useState, ViewTransition } from "react";

/** Fotos del producto: una grande y las demás como miniaturas, con visor. */
export function GaleriaProducto({
  imagenes,
  nombre,
  slug,
}: {
  imagenes: ImagenGuardada[];
  nombre: string;
  /** Empareja esta foto con su miniatura en la tienda para la transición. */
  slug: string;
}) {
  const [indice, setIndice] = useState(0);
  const [visible, setVisible] = useState(false);
  const actual = imagenes[indice];

  if (!actual) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-canvas-sunken text-sm text-ink-subtle">
        Sin fotos todavía
      </div>
    );
  }

  return (
    <div>
      {/* El nombre va en el marco y no en la foto: así sigue siendo "la misma
          pieza" aunque se cambie de miniatura antes de volver a la tienda. */}
      <ViewTransition name={`producto-${slug}`} share="pieza" default="none">
        <button
          type="button"
          onClick={() => setVisible(true)}
          aria-label={`Ver ${nombre} a tamaño completo`}
          className="block w-full overflow-hidden rounded-xl border border-border bg-canvas-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={miniaturaDesdeUrl(actual.url, 1000, "limit") ?? actual.url}
            alt={actual.alt}
            className="aspect-square w-full object-contain"
          />
        </button>
      </ViewTransition>

      {imagenes.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {imagenes.map((imagen, i) => (
            <li key={imagen.publicId}>
              <button
                type="button"
                onClick={() => setIndice(i)}
                aria-label={`Ver la foto ${i + 1}`}
                aria-current={i === indice ? "true" : undefined}
                className={`block w-full overflow-hidden rounded-lg border transition-colors ${
                  i === indice ? "border-accent" : "border-border hover:border-border-strong"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={miniaturaDesdeUrl(imagen.url, 200) ?? imagen.url}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <VisorDeImagen
        open={visible}
        onOpenChange={setVisible}
        titulo={nombre}
        src={miniaturaDesdeUrl(actual.url, 1600, "limit") ?? actual.url}
        alt={actual.alt}
        navegacion={
          imagenes.length > 1
            ? {
                onAnterior: () => setIndice((i) => (i - 1 + imagenes.length) % imagenes.length),
                onSiguiente: () => setIndice((i) => (i + 1) % imagenes.length),
                posicion: `Foto ${indice + 1} de ${imagenes.length}`,
              }
            : undefined
        }
      />
    </div>
  );
}
