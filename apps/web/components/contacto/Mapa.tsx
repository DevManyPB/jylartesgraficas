"use client";

import "leaflet/dist/leaflet.css";
import { cn } from "@jyl/ui";
import { useEffect, useRef } from "react";

interface MapaProps {
  lat: number;
  lng: number;
  /** Lo que se lee al pasar por encima del punto y en el lector de pantalla. */
  titulo: string;
  /** Alto del mapa, para que cada página lo encaje en su maquetación. */
  alto?: string;
}

/**
 * Mapa con Leaflet y OpenStreetMap — SPEC.md §2.6: nada de Google Maps, que
 * exige cuenta de facturación.
 *
 * Nocturno (SPEC.md §4.6): las teselas de OpenStreetMap se oscurecen con un
 * filtro de CSS (clase `mapa-nocturno` en globals.css), así que no hace falta
 * otro proveedor de mapas ni otra cuenta. Lo único con color es el marcador:
 * una cruz de registro con las tres tintas corridas, que encajan al pasar el
 * ratón, como los títulos del sitio. Está dibujado en SVG, sin las imágenes
 * que Leaflet trae y que un empaquetador suele romper.
 *
 * La librería no se descarga hasta que el mapa entra en pantalla (SPEC.md
 * §4.6). En el inicio eso importa: el mapa está al final de la página y
 * nadie debería pagar su descarga mientras mira el portafolio.
 *
 * El mapa es un complemento: la dirección, el teléfono y "Cómo llegar" están
 * en la página como texto y funcionan sin él.
 */
/**
 * La cruz de registro del marcador. Leaflet la recibe como HTML, así que los
 * colores van como clases de Tailwind (que sí las encuentra en este archivo)
 * y no escritos a mano. Tres círculos corridos —cian, amarillo, magenta—, el
 * punto magenta y la cruz en claro.
 */
const PIN_REGISTRO = `<svg viewBox="0 0 44 44" width="44" height="44" class="pin-registro" aria-hidden="true">
  <circle cx="22" cy="22" r="11" fill="none" stroke-width="2" class="pin-capa pin-cian stroke-tinta-cian" />
  <circle cx="22" cy="22" r="11" fill="none" stroke-width="2" class="pin-capa pin-amarillo stroke-tinta-amarillo" />
  <circle cx="22" cy="22" r="11" fill="none" stroke-width="2" class="stroke-accent" />
  <circle cx="22" cy="22" r="4.5" class="fill-accent" />
  <path d="M22 2V42M2 22H42" stroke-width="1.2" class="stroke-ink-inverted" />
</svg>`;

export function Mapa({ lat, lng, titulo, alto = "h-72 sm:h-96" }: MapaProps) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;
    let mapa: import("leaflet").Map | null = null;
    let cancelado = false;

    // Un margen generoso: que llegue cargado justo antes de verse.
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting) {
          observador.disconnect();
          void dibujar(nodo);
        }
      },
      { rootMargin: "200px" },
    );

    async function dibujar(destino: HTMLDivElement) {
      const L = await import("leaflet");
      if (cancelado) return;

      mapa = L.map(destino, { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], 16);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapa);

      L.marker([lat, lng], {
        title: titulo,
        alt: titulo,
        icon: L.divIcon({
          className: "",
          html: PIN_REGISTRO,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
      }).addTo(mapa);
    }

    observador.observe(nodo);

    return () => {
      cancelado = true;
      observador.disconnect();
      mapa?.remove();
    };
  }, [lat, lng, titulo]);

  return (
    <div
      ref={contenedor}
      role="img"
      aria-label={`Mapa con la ubicación de ${titulo}`}
      className={cn("mapa-nocturno w-full overflow-hidden rounded-xl border border-ink bg-canvas-dark", alto)}
    />
  );
}
