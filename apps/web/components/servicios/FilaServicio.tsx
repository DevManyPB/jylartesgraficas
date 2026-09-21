import { cn } from "@jyl/ui";
import Link from "next/link";
import { IconoFlecha } from "@/components/iconos/Iconos";

/**
 * Un servicio, en una fila a todo el ancho.
 *
 * Antes cada servicio era una tarjeta con un nombre dentro y un «Pedir este
 * servicio» en rosa. Catorce tarjetas casi vacías se leían como una página a
 * medio cargar, y catorce acentos seguidos dejaban de significar nada
 * (SPEC.md §9: un solo acento, usado poco y con intención).
 *
 * Si lo único que hay de un servicio es su nombre, entonces el nombre tiene
 * que ser lo grande de la pantalla. El número de catálogo a la izquierda y la
 * línea de abajo hacen el resto: se lee como un índice de lo que el estudio
 * sabe hacer, no como un formulario.
 *
 * Toda la fila es el enlace —no un enlace pequeño dentro de ella— y el acento
 * aparece solo al pasar por encima o al llegar con el teclado, que es cuando
 * significa algo.
 */
export function FilaServicio({ id, nombre, numero }: { id: string; nombre: string; numero: number }) {
  return (
    <Link
      href={`/pedido?servicio=${id}`}
      className="group/fila relative block overflow-hidden border-b border-border focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
    >
      {/* El relleno entra desde la izquierda, como en los botones: el sitio
          entero usa el mismo gesto para decir «esto se pulsa». */}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-canvas-sunken transition-transform duration-500 ease-entrada group-hover/fila:translate-x-0 group-focus-visible/fila:translate-x-0 motion-reduce:transition-none"
      />

      <span className="relative flex items-center gap-4 px-2 py-5 transition-transform duration-300 ease-entrada group-hover/fila:translate-x-2 group-focus-visible/fila:translate-x-2 motion-reduce:transition-none sm:gap-6 sm:px-4 sm:py-6">
        <span className="w-7 shrink-0 font-display text-xs tabular-nums text-ink-subtle">
          {String(numero).padStart(2, "0")}
        </span>

        <span
          className={cn(
            "flex-1 font-display text-2xl leading-tight text-ink transition-colors duration-300",
            "group-hover/fila:text-accent group-focus-visible/fila:text-accent sm:text-3xl lg:text-4xl",
          )}
        >
          {nombre}
        </span>

        {/* «Pedirlo» solo aparece cuando hace falta. En móvil no hay ratón, así
            que la flecha se queda puesta para que se note que la fila lleva
            a algún sitio. */}
        <span className="flex shrink-0 items-center gap-2 text-sm text-accent">
          <span className="hidden opacity-0 transition-opacity duration-300 group-hover/fila:opacity-100 group-focus-visible/fila:opacity-100 motion-reduce:transition-none sm:inline">
            Pedirlo
          </span>
          <IconoFlecha className="h-5 w-5 transition-transform duration-300 ease-entrada group-hover/fila:translate-x-1 group-focus-visible/fila:translate-x-1 motion-reduce:transition-none sm:opacity-40 sm:transition-[transform,opacity] sm:group-hover/fila:opacity-100 sm:group-focus-visible/fila:opacity-100" />
        </span>
      </span>
    </Link>
  );
}
