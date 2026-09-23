import type { Configuracion } from "@jyl/core";
import { cn } from "@jyl/ui";
import Link from "next/link";
import { EstadoAhora } from "@/components/horario/EstadoAhora";
import { IconoCorreo, IconoTelefono, IconoUbicacion, IconoWhatsapp } from "@/components/iconos/Iconos";
import { enlaceWhatsapp, lineaDeDireccion } from "@/lib/formato";

/**
 * Los datos del estudio como una tarjeta de visita impresa — SPEC.md §4.2.
 *
 * La tarjeta está girada y fuera de sus marcas de corte. Al pasar el ratón
 * o al llegar a ella con el teclado se endereza y cae justo dentro de las
 * marcas: el mismo gesto de registro de los títulos del sitio (SPEC.md §9).
 * Con `prefers-reduced-motion` ya sale derecha y quieta.
 *
 * Todo sale de Configuración; lo que el estudio no haya puesto no aparece.
 */
export function TarjetaDeVisita({ configuracion }: { configuracion: Configuracion }) {
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp, "Hola, quiero preguntar por un trabajo.");
  const direccion = lineaDeDireccion(configuracion.direccion);
  const hayHorarios = configuracion.horarios.some((h) => !h.cerrado && h.abre && h.cierra);

  const fila = "flex items-center gap-2.5 underline-offset-4 hover:text-accent hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    // El margen deja sitio a las marcas de corte, que van por fuera.
    <div className="group/tarjeta relative m-5 max-w-sm">
      <MarcaDeCorte className="-left-5 -top-5" />
      <MarcaDeCorte className="-right-5 -top-5 rotate-90" />
      <MarcaDeCorte className="-bottom-5 -right-5 rotate-180" />
      <MarcaDeCorte className="-bottom-5 -left-5 -rotate-90" />

      <div
        className={cn(
          "relative flex flex-col justify-between gap-6 rounded-sm border border-border-strong bg-canvas p-6 text-ink sm:aspect-[85/55]",
          // Sombra dura y desplazada, como papel sobre la mesa; no la sombra
          // gris difusa que veta AGENTS.md §8.
          "shadow-[5px_5px_0_0_theme(colors.ink)] shadow-ink/10",
          "motion-safe:-rotate-3 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-entrada",
          "motion-safe:group-hover/tarjeta:rotate-0 motion-safe:group-focus-within/tarjeta:rotate-0",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-3xl font-bold leading-none tracking-tight">JYL</p>
            <p className="mt-1 text-xs text-ink-muted">artes gráficas</p>
          </div>
          <CruzDeRegistro />
        </div>

        <ul className="flex flex-col gap-1.5 text-sm">
          {configuracion.telefono && (
            <li>
              <a href={`tel:${configuracion.telefono.replace(/\s/g, "")}`} className={cn(fila, "tabular-nums")}>
                <IconoTelefono className="h-4 w-4 text-ink-muted" />
                {configuracion.telefono}
              </a>
            </li>
          )}
          {whatsapp && (
            <li>
              <a href={whatsapp} target="_blank" rel="noreferrer" className={fila}>
                <IconoWhatsapp className="h-4 w-4 text-ink-muted" />
                Escríbenos por WhatsApp
              </a>
            </li>
          )}
          {configuracion.email && (
            <li>
              <a href={`mailto:${configuracion.email}`} className={cn(fila, "break-all")}>
                <IconoCorreo className="h-4 w-4 text-ink-muted" />
                {configuracion.email}
              </a>
            </li>
          )}
          {direccion && (
            <li>
              <Link href="/contacto" className={fila}>
                <IconoUbicacion className="h-4 w-4 shrink-0 text-ink-muted" />
                {direccion}
              </Link>
            </li>
          )}
        </ul>

        {hayHorarios && <EstadoAhora horarios={configuracion.horarios} />}
      </div>
    </div>
  );
}

/**
 * Esquina de corte: prolonga los dos bordes de la tarjeta hacia fuera, sin
 * llegar a tocarla, como en un pliego. Dibujada para la esquina superior
 * izquierda (la tarjeta empieza en 20,20); las otras tres son la misma,
 * girada sobre su centro.
 */
function MarcaDeCorte({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={cn("absolute h-5 w-5 overflow-visible", className)}>
      <path d="M20 0V13M0 20H13" fill="none" className="stroke-ink/50" strokeWidth="1" />
    </svg>
  );
}

/** La cruz de registro del estudio, en la esquina de la tarjeta. */
function CruzDeRegistro() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0">
      <g fill="none" strokeWidth="1" className="stroke-accent">
        <circle cx="12" cy="12" r="6" />
        <path d="M12 0V24M0 12H24" />
      </g>
    </svg>
  );
}
