"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

interface MapaProps {
  lat: number;
  lng: number;
  /** Lo que se lee al pasar por encima del punto y en el lector de pantalla. */
  titulo: string;
}

/**
 * Mapa con Leaflet y OpenStreetMap — SPEC.md §2.6: nada de Google Maps, que
 * exige cuenta de facturación. Leaflet se carga solo en el navegador y solo
 * en esta página; el marcador es un punto dibujado, para no depender de las
 * imágenes que Leaflet trae y que un empaquetador suele romper.
 *
 * El mapa es un complemento: la dirección, el teléfono y "Cómo llegar" están
 * en la página como texto y funcionan sin él.
 */
export function Mapa({ lat, lng, titulo }: MapaProps) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;
    let mapa: import("leaflet").Map | null = null;
    let cancelado = false;

    void (async () => {
      const L = await import("leaflet");
      if (cancelado || !contenedor.current) return;

      mapa = L.map(nodo, { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], 16);
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
    })();

    return () => {
      cancelado = true;
      mapa?.remove();
    };
  }, [lat, lng, titulo]);

  return (
    <div
      ref={contenedor}
      role="img"
      aria-label={`Mapa con la ubicación de ${titulo}`}
      className="h-72 w-full overflow-hidden rounded-xl border border-border bg-canvas-sunken sm:h-96"
    />
  );
}
