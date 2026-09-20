import type { Configuracion } from "@jyl/core";
import { DIAS_SEMANA, type ProductoPublicoConVariantes } from "@jyl/core";
import { SITIO_URL } from "@/lib/sitio";

/**
 * Datos estructurados — SPEC.md §10. Solo se declara lo que el estudio tiene
 * configurado de verdad: si no hay dirección o no hay horarios, esos campos
 * no salen, porque un dato inventado aquí es el que acaba en Google.
 */

/** Los días que schema.org espera, en el mismo orden que los guarda el panel. */
const DIA_SCHEMA: Record<(typeof DIAS_SEMANA)[number], string> = {
  lunes: "Monday",
  martes: "Tuesday",
  miercoles: "Wednesday",
  jueves: "Thursday",
  viernes: "Friday",
  sabado: "Saturday",
  domingo: "Sunday",
};

function Json({ datos }: { datos: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // El contenido lo arma el servidor a partir de datos ya validados.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(datos).replace(/</g, "\\u003c") }}
    />
  );
}

export function NegocioLocal({ configuracion }: { configuracion: Configuracion }) {
  const { direccion, horarios } = configuracion;
  const abre = horarios.filter((h) => !h.cerrado && h.abre && h.cierra);

  return (
    <Json
      datos={{
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: "JYL Artes Gráficos",
        description: "Artes gráficas, desarrollo web y servicios técnicos.",
        url: SITIO_URL,
        ...(configuracion.telefono ? { telephone: configuracion.telefono } : {}),
        ...(configuracion.email ? { email: configuracion.email } : {}),
        ...(direccion.linea || direccion.ciudad
          ? {
              address: {
                "@type": "PostalAddress",
                ...(direccion.linea ? { streetAddress: direccion.linea } : {}),
                ...(direccion.barrio ? { addressLocality: direccion.barrio } : {}),
                ...(direccion.ciudad ? { addressRegion: direccion.ciudad } : {}),
                addressCountry: "CO",
              },
            }
          : {}),
        ...(direccion.lat !== null && direccion.lng !== null
          ? { geo: { "@type": "GeoCoordinates", latitude: direccion.lat, longitude: direccion.lng } }
          : {}),
        ...(abre.length > 0
          ? {
              openingHoursSpecification: abre.map((h) => ({
                "@type": "OpeningHoursSpecification",
                dayOfWeek: `https://schema.org/${DIA_SCHEMA[h.dia]}`,
                opens: h.abre,
                closes: h.cierra,
              })),
            }
          : {}),
        ...(Object.values(configuracion.redes).some(Boolean)
          ? { sameAs: Object.values(configuracion.redes).filter(Boolean) }
          : {}),
      }}
    />
  );
}

export function ProductoEstructurado({ producto }: { producto: ProductoPublicoConVariantes }) {
  const disponibles = producto.variantes.filter((v) => v.stock > 0);
  const precios = producto.variantes.map((v) => v.precioVenta).filter((p) => p > 0);

  return (
    <Json
      datos={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: producto.nombre,
        ...(producto.descripcion ? { description: producto.descripcion } : {}),
        ...(producto.categoria ? { category: producto.categoria } : {}),
        ...(producto.imagenes.length > 0 ? { image: producto.imagenes.map((i) => i.url) } : {}),
        url: `${SITIO_URL}/tienda/${producto.slug}`,
        brand: { "@type": "Brand", name: "JYL Artes Gráficos" },
        ...(precios.length > 0
          ? {
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "COP",
                lowPrice: Math.min(...precios),
                highPrice: Math.max(...precios),
                offerCount: producto.variantes.length,
                availability:
                  disponibles.length > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              },
            }
          : {}),
      }}
    />
  );
}
