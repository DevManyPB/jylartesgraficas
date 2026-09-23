import { cn } from "@jyl/ui";
import type { CSSProperties } from "react";
import { GuiasDeCorte } from "./GuiasDeCorte";

/**
 * Fondo del héroe: un pliego de imprenta — SPEC.md §4.3.
 *
 * Todo lo que se dibuja existe en un pliego real, así que el fondo habla del
 * oficio en vez de ser decoración:
 * - la cuadrícula de una mesa de corte, fina cada 24 px y marcada cada 120;
 * - marcas de corte en las esquinas de la zona de contenido;
 * - cruces de registro a media altura, a cada lado;
 * - una tira de control de tono, con el acento como último parche.
 *
 * Es SVG en el servidor y sin degradados (AGENTS.md §8). Los colores son los
 * tokens con opacidad, nunca escritos a mano (AGENTS.md §9).
 *
 * Movimiento (SPEC.md §9): al cargar, el pliego «se imprime» a la vez que
 * entra el texto (las clases `pliego-*` de globals.css). Después solo se
 * mueve con el cursor: ver `GuiasDeCorte`.
 *
 * Si hay una pieza destacada, va encima de su foto: se lee como el pliego en
 * el que se imprimió el trabajo.
 */

/** Cuándo empieza cada pieza de la entrada, en milisegundos. */
const retraso = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export function PliegoImprenta() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* Cuadrícula de la mesa de corte. */}
      <svg className="pliego-cuadricula absolute inset-0 h-full w-full">
        <defs>
          <pattern id="pliego-celda" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" className="stroke-ink-inverted/[0.06]" strokeWidth="1" />
          </pattern>
          <pattern id="pliego-modulo" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="url(#pliego-celda)" />
            <path d="M120 0H0V120" fill="none" className="stroke-ink-inverted/[0.11]" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pliego-modulo)" />
      </svg>

      <GuiasDeCorte />

      {/* La zona de contenido, marcada como el área útil del pliego: la
          misma rejilla que el texto del héroe, entre el header y el pie. */}
      <div className="absolute inset-x-6 bottom-8 top-24 mx-auto max-w-content lg:inset-x-8 lg:top-28">
        <MarcaDeCorte className="-left-3 -top-3" desde={250} />
        <MarcaDeCorte className="-right-3 -top-3 rotate-90" desde={330} />
        <MarcaDeCorte className="-bottom-3 -right-3 rotate-180" desde={410} />
        <MarcaDeCorte className="-bottom-3 -left-3 -rotate-90" desde={490} />

        <CruzDeRegistro className="-left-11 top-1/2 hidden -translate-y-1/2 lg:block" desde={550} />
        <CruzDeRegistro className="-right-11 top-1/2 hidden -translate-y-1/2 lg:block" desde={650} />

        <TiraDeControl desde={800} />
      </div>
    </div>
  );
}

/**
 * Dos trazos que no llegan a tocar la esquina, como en un pliego: la marca
 * dice dónde cortar sin invadir lo impreso. Dibujada para la esquina superior
 * izquierda; las otras tres son la misma, girada.
 */
function MarcaDeCorte({ className, desde }: { className: string; desde: number }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("absolute h-6 w-6", className)}>
      <path
        d="M12 0V8M0 12H8"
        pathLength={1}
        fill="none"
        className="pliego-traza stroke-ink-inverted/50"
        strokeWidth="1"
        style={retraso(desde)}
      />
    </svg>
  );
}

/**
 * Círculo con cruz: donde se alinean las planchas de cada color. Al cargar
 * entra girando; después gira con el cursor (`--giro-registro`, que escribe
 * `GuiasDeCorte`). El giro con el cursor va en la propiedad `rotate` del
 * <svg> y el de la entrada en el <g>, para que no se pisen.
 */
function CruzDeRegistro({ className, desde }: { className: string; desde: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn(
        "absolute h-8 w-8 [rotate:var(--giro-registro,0deg)] motion-safe:[transition:rotate_700ms_cubic-bezier(0.2,0.65,0.3,1)]",
        className,
      )}
    >
      <g fill="none" className="pliego-registro stroke-ink-inverted/45" strokeWidth="1" style={retraso(desde)}>
        <circle cx="16" cy="16" r="9" pathLength={1} className="pliego-traza" style={retraso(desde + 100)} />
        <circle cx="16" cy="16" r="4" pathLength={1} className="pliego-traza" style={retraso(desde + 200)} />
        <path d="M16 0V32M0 16H32" />
      </g>
    </svg>
  );
}

/**
 * Tira de control: parches de la tinta al 100, 70, 45 y 20 %, y el acento
 * del estudio al final. Pegada al borde inferior izquierdo del área útil, por
 * fuera, donde va en un pliego. A la derecha la tapaba el botón de WhatsApp.
 */
function TiraDeControl({ desde }: { desde: number }) {
  const tonos = [
    "bg-ink-inverted/90",
    "bg-ink-inverted/70",
    "bg-ink-inverted/45",
    "bg-ink-inverted/20",
    "bg-accent",
  ];
  return (
    <div className="absolute -bottom-6 left-6 flex">
      {tonos.map((tono, i) => (
        <span key={tono} className={cn("pliego-parche h-2.5 w-2.5", tono)} style={retraso(desde + i * 70)} />
      ))}
    </div>
  );
}
