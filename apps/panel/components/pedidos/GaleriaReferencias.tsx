"use client";

import { miniaturaDesdeUrl, urlDeDescarga, type ArchivoDelPedido } from "@jyl/core";
import { VisorDeImagen } from "@jyl/ui";
import { useState } from "react";
import { pesoDeArchivo } from "./formato";

function nombreDe(archivo: ArchivoDelPedido, indice: number): string {
  return `Referencia ${indice + 1}.${archivo.formato || "archivo"}`;
}

/**
 * Referencias del cliente — SPEC.md §6.3: galería con visor en modal y
 * descarga. Los PDF, AI y PSD también muestran su primera página, porque
 * Cloudinary la rasteriza; si un archivo quedó como `raw`, se ofrece solo
 * la descarga.
 */
export function GaleriaReferencias({ archivos, numero }: { archivos: ArchivoDelPedido[]; numero: string }) {
  // Cuál se muestra y si el visor está abierto van por separado: al cerrar,
  // el visor sigue montado mientras se anima y devuelve el foco a la
  // miniatura que lo abrió (SPEC.md §5.3).
  const [indice, setIndice] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const actual = archivos[indice];

  return (
    <>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {archivos.map((archivo, i) => {
          const miniatura = miniaturaDesdeUrl(archivo.url, 240);
          const nombre = nombreDe(archivo, i);
          return (
            <li key={archivo.publicId}>
              {miniatura ? (
                <button
                  type="button"
                  onClick={() => {
                    setIndice(i);
                    setAbierto(true);
                  }}
                  aria-label={`Ver ${nombre}`}
                  className="group block w-full overflow-hidden rounded-md border border-border bg-canvas-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={miniatura}
                    alt=""
                    loading="lazy"
                    className="aspect-square w-full object-cover transition-opacity group-hover:opacity-90"
                  />
                </button>
              ) : (
                <a
                  href={urlDeDescarga(archivo.url)}
                  className="flex aspect-square w-full flex-col items-center justify-center rounded-md border border-border bg-canvas-sunken text-xs text-ink-muted hover:text-ink"
                >
                  <span className="font-medium uppercase">{archivo.formato || "archivo"}</span>
                  <span>Descargar</span>
                </a>
              )}
              <p className="mt-1 truncate text-[11px] text-ink-subtle">
                {archivo.formato.toUpperCase()} · {pesoDeArchivo(archivo.bytes)}
              </p>
            </li>
          );
        })}
      </ul>

      {actual && (
        <VisorDeImagen
          open={abierto}
          onOpenChange={setAbierto}
          titulo={`${numero} · ${nombreDe(actual, indice)}`}
          src={miniaturaDesdeUrl(actual.url, 1600, "limit") ?? actual.url}
          alt={`Referencia ${indice + 1} que adjuntó el cliente al pedido ${numero}`}
          pie={[
            actual.formato.toUpperCase(),
            pesoDeArchivo(actual.bytes),
            actual.ancho && actual.alto ? `${actual.ancho} × ${actual.alto} px` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
          descarga={{ href: urlDeDescarga(actual.url), etiqueta: "Descargar original" }}
        />
      )}
    </>
  );
}
