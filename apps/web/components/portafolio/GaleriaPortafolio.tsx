"use client";

import { miniaturaDesdeUrl, type ProyectoPublico } from "@jyl/core";
import { VisorDeImagen } from "@jyl/ui";
import { useState } from "react";

interface Abierto {
  proyecto: number;
  imagen: number;
}

/**
 * Las piezas del portafolio — SPEC.md §4.3 y §5.1: la ficha abre el visor a
 * tamaño completo. Cada foto se muestra en su proporción real, nunca
 * recortada (AGENTS.md §8), así que la rejilla es de columnas con las piezas
 * apiladas: una pieza alta se ve alta.
 */
export function GaleriaPortafolio({ proyectos }: { proyectos: ProyectoPublico[] }) {
  const [abierto, setAbierto] = useState<Abierto | null>(null);
  const [visible, setVisible] = useState(false);

  const proyecto = abierto ? proyectos[abierto.proyecto] : undefined;
  const imagen = proyecto?.imagenes[abierto?.imagen ?? 0];

  function mover(paso: number) {
    setAbierto((actual) => {
      if (!actual) return actual;
      const fotos = proyectos[actual.proyecto]?.imagenes.length ?? 1;
      return { ...actual, imagen: (actual.imagen + paso + fotos) % fotos };
    });
  }

  return (
    <>
      <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {proyectos.map((p, i) => {
          const portada = p.imagenes[0];
          if (!portada) return null;
          return (
            <li key={p.slug} className="mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => {
                  setAbierto({ proyecto: i, imagen: 0 });
                  setVisible(true);
                }}
                className="group block w-full overflow-hidden rounded-xl border border-border bg-canvas-sunken text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={miniaturaDesdeUrl(portada.url, 900, "limit") ?? portada.url}
                  alt={portada.alt}
                  loading="lazy"
                  width={portada.ancho ?? undefined}
                  height={portada.alto ?? undefined}
                  className="w-full transition-opacity group-hover:opacity-95"
                />
                <span className="block p-4">
                  <span className="block font-display text-lg text-ink">{p.titulo}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {p.categoria}
                    {p.cliente && ` · ${p.cliente}`}
                    {p.imagenes.length > 1 && ` · ${p.imagenes.length} fotos`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {proyecto && imagen && (
        <VisorDeImagen
          open={visible}
          onOpenChange={setVisible}
          titulo={proyecto.titulo}
          src={miniaturaDesdeUrl(imagen.url, 1600, "limit") ?? imagen.url}
          alt={imagen.alt}
          pie={[proyecto.categoria, proyecto.cliente || null, proyecto.descripcion || null].filter(Boolean).join(" · ")}
          navegacion={
            proyecto.imagenes.length > 1
              ? {
                  onAnterior: () => mover(-1),
                  onSiguiente: () => mover(1),
                  posicion: `Foto ${(abierto?.imagen ?? 0) + 1} de ${proyecto.imagenes.length}`,
                }
              : undefined
          }
        />
      )}
    </>
  );
}
