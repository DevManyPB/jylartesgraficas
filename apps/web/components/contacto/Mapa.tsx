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
 * exige cuenta de facturación. El marcador es un punto dibujado, para no
 * depender de las imágenes que Leaflet trae y que un empaquetador suele
 * romper.
 *
 * La librería no se descarga hasta que el mapa entra en pantalla (SPEC.md
 * §4.6). En el inicio eso importa: el mapa está al final de la página y
 * nadie debería pagar su descarga mientras mira el portafolio.
 *
 * El mapa es un complemento: la dirección, el teléfono y "Cómo llegar" están
 * en la página como texto y funcionan sin él.
 */
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
          html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#D6127A;box-shadow:0 0 0 4px rgba(214,18,122,.25)"></span>',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
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
      className={cn("w-full overflow-hidden rounded-xl border border-border bg-canvas-sunken", alto)}
    />
  );
}
