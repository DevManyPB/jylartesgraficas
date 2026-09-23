import { cn } from "@jyl/ui";
import Link from "next/link";
import { CLASE_TINTA } from "@/components/cmyk/areas";
import { Trama, type Tinta } from "@/components/cmyk/Trama";

/**
 * Un servicio, en una fila a todo el ancho.
 *
 * Si lo único que hay de un servicio es su nombre, el nombre tiene que ser lo
 * grande de la pantalla: por eso no es una tarjeta, que con un nombre dentro
 * se lee como un hueco sin llenar.
 *
 * Toda la fila es el enlace —no un enlace pequeño dentro de ella—. Al pasar
 * por encima o al llegar con el teclado entra desde la izquierda una trama en
 * la tinta del área, y el nombre se imprime una segunda vez, corrido, en esa
 * misma tinta (SPEC.md §9, registro CMYK). «Pedirlo» es lo único en magenta:
 * es la acción.
 *
 * Sin numeración ni flecha: los servicios no son una secuencia, y una flecha
 * en cada fila es exactamente la muletilla que AGENTS.md §8 veta.
 */
export function FilaServicio({ id, nombre, tinta }: { id: string; nombre: string; tinta: Tinta }) {
  return (
    <Link
      href={`/pedido?servicio=${id}`}
      className={cn(
        "group/fila relative block overflow-hidden border-b border-border focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
        CLASE_TINTA[tinta],
      )}
    >
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full opacity-30 transition-transform duration-500 ease-entrada group-hover/fila:translate-x-0 group-focus-visible/fila:translate-x-0 motion-reduce:transition-none"
      >
        <Trama tinta={tinta} paso={7} radio={1.5} />
      </span>

      <span className="relative flex items-baseline justify-between gap-4 px-2 py-5 transition-transform duration-300 ease-entrada group-hover/fila:translate-x-2 group-focus-visible/fila:translate-x-2 motion-reduce:transition-none sm:gap-6 sm:px-4 sm:py-6">
        <span className="plancha font-display text-2xl leading-tight text-ink sm:text-3xl lg:text-4xl">{nombre}</span>

        {/* En pantallas con ratón aparece al pasar por encima; en móvil,
            donde no hay "pasar por encima", se queda puesto para que se note
            que la fila lleva a algún sitio. */}
        <span className="shrink-0 text-sm text-accent transition-opacity duration-300 motion-reduce:transition-none sm:opacity-0 sm:group-hover/fila:opacity-100 sm:group-focus-visible/fila:opacity-100">
          Pedirlo
        </span>
      </span>
    </Link>
  );
}
