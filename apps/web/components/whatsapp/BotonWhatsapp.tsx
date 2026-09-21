"use client";

import { usePathname } from "next/navigation";

/**
 * Botón flotante de WhatsApp — SPEC.md §4.7: en todas las páginas, con el
 * mensaje ya escrito según desde dónde se escribe, para que el estudio sepa
 * de qué le están hablando sin tener que preguntarlo.
 *
 * Va por debajo de los modales (z-30 contra el z-40 del fondo del modal) y
 * por debajo del menú móvil, así que nunca queda flotando sobre una capa que
 * debería taparlo. En móvil es solo el círculo; la etiqueta aparece en
 * pantallas grandes, donde sobra espacio a los lados.
 */

/** El mensaje que se abre ya escrito, por sección. */
function mensajeDe(ruta: string): string {
  if (ruta === "/") return "Hola, quiero preguntar por un trabajo.";
  if (ruta.startsWith("/portafolio")) return "Hola, vi el portafolio y quiero algo parecido para mí.";
  if (ruta.startsWith("/servicios")) return "Hola, quiero preguntar por un servicio.";
  if (ruta.startsWith("/tienda")) return "Hola, quiero preguntar por un producto de la tienda.";
  if (ruta.startsWith("/pedido")) return "Hola, tengo una duda con el pedido que estoy llenando.";
  if (ruta.startsWith("/mi-cuenta")) return "Hola, quiero preguntar por uno de mis pedidos.";
  if (ruta.startsWith("/nosotros")) return "Hola, quiero preguntar por un trabajo.";
  return "Hola, quiero hacer una consulta.";
}

export function BotonWhatsapp({ numero }: { numero: string }) {
  const ruta = usePathname();
  const enlace = `https://wa.me/${numero}?text=${encodeURIComponent(mensajeDe(ruta))}`;

  return (
    <a
      href={enlace}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir por WhatsApp"
      // El margen con `--removed-body-scroll-bar-size` es por lo mismo que en
      // el header: al abrirse un modal desaparece la barra de scroll y, sin
      // esto, el botón daría un salto de 15 px hacia la derecha.
      className="group fixed bottom-4 right-4 z-30 mr-[var(--removed-body-scroll-bar-size,0px)] flex h-14 items-center gap-3 rounded-full bg-success px-4 text-ink-inverted shadow-lg transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success motion-reduce:transition-none motion-reduce:hover:scale-100 sm:bottom-6 sm:right-6"
    >
      <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      {/* La etiqueta solo donde sobra ancho: en móvil taparía la página. */}
      <span className="hidden pr-1 text-sm font-medium lg:inline">Escríbenos</span>
    </a>
  );
}
