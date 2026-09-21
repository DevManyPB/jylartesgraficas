import { miniaturaDesdeUrl, type ProyectoPublico } from "@jyl/core";
import { cn } from "@jyl/ui";
import Link from "next/link";

/**
 * Una pieza del portafolio en el inicio — SPEC.md §4.3 y §9: con su
 * proporción real, nunca recortada a un cuadrado. Por eso la foto lleva su
 * ancho y su alto declarados: el navegador reserva el sitio exacto antes de
 * descargarla y la página no da el salto que penaliza el CLS.
 *
 * El movimiento responde a lo que hace el usuario (§9): al pasar por encima
 * la foto se acerca un poco dentro de su marco y el título toma el acento.
 * No hay animación de entrada al hacer scroll.
 */
interface PiezaProps {
  pieza: ProyectoPublico;
  /** Ancho que se le pide a Cloudinary, según el hueco que va a ocupar. */
  ancho: number;
  /**
   * La pieza que abre la sección, a todo el ancho. Se limita el alto a la
   * pantalla, sin recortar: una pieza vertical se enmarca sobre el fondo en
   * vez de ocupar tres pantallas de scroll.
   */
  protagonista?: boolean;
  prioritaria?: boolean;
}

export function Pieza({ pieza, ancho, protagonista, prioritaria }: PiezaProps) {
  const portada = pieza.imagenes[0];
  if (!portada) return null;

  return (
    <Link
      href={`/portafolio?categoria=${encodeURIComponent(pieza.categoria)}`}
      className="group block overflow-hidden rounded-xl border border-border bg-canvas-sunken transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={miniaturaDesdeUrl(portada.url, ancho, "limit") ?? portada.url}
          alt={portada.alt}
          width={portada.ancho ?? undefined}
          height={portada.alto ?? undefined}
          loading={prioritaria ? "eager" : "lazy"}
          className={cn(
            "transition-transform duration-500 ease-entrada group-hover:scale-[1.03]",
            "motion-reduce:transition-none motion-reduce:group-hover:scale-100",
            // `cn` no resuelve conflictos de Tailwind: `w-full` y `w-auto`
            // juntos dejarían mandar al orden del CSS, y con el alto limitado
            // la foto saldría estirada. Se elige uno de los dos.
            protagonista ? "mx-auto max-h-[70vh] w-auto max-w-full" : "w-full",
          )}
        />
      </span>
      <span className="block bg-canvas p-4">
        <span className="block font-display text-lg text-ink transition-colors group-hover:text-accent">
          {pieza.titulo}
        </span>
        <span className="mt-0.5 block text-sm text-ink-muted">
          {pieza.categoria}
          {pieza.cliente && ` · ${pieza.cliente}`}
        </span>
      </span>
    </Link>
  );
}
