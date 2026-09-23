"use client";

import { createAnimatable } from "animejs";
import { useEffect, useRef } from "react";

/** Lado de la celda fina de la cuadrícula del pliego, en píxeles. */
const CELDA = 24;
/** Cuánto giran las cruces de registro de un borde al otro del héroe. */
const GIRO_MAXIMO = 180;

/** El segundo argumento es la duración: 0 coloca sin animar. */
type Animador = (valor: number, duracion?: number) => void;

/**
 * Guías de corte que siguen al cursor por el héroe — SPEC.md §4.3.
 *
 * Como en una mesa de corte: una regla vertical y otra horizontal se cruzan
 * donde está el cursor, la celda de la cuadrícula que queda debajo se marca y
 * las cruces de registro giran según la posición. Es movimiento que responde
 * a quien mira, no que pasa solo (SPEC.md §9).
 *
 * Las guías se deslizan con anime.js (`createAnimatable`, como el imán de los
 * botones): cada movimiento solo le pasa un número a un animador ya creado, y
 * la guía llega con un poco de retraso elástico en vez de ir pegada al
 * puntero, que es lo que la hace sentirse física.
 *
 * Sin cursor (pantallas táctiles) o con `prefers-reduced-motion`, no hace
 * nada: las guías no se muestran y el pliego queda quieto.
 */
export function GuiasDeCorte() {
  const capaRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLSpanElement>(null);
  const horizontalRef = useRef<HTMLSpanElement>(null);
  const celdaRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const capa = capaRef.current;
    const vertical = verticalRef.current;
    const horizontal = horizontalRef.current;
    const celda = celdaRef.current;
    const heroe = capa?.closest<HTMLElement>("[data-hero]");
    if (!capa || !vertical || !horizontal || !celda || !heroe) return;

    const conCursor = window.matchMedia("(pointer: fine)").matches;
    const quiereMovimiento = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!conCursor || !quiereMovimiento) return;

    // anime.js tipa las propiedades como un índice abierto; aquí se sabe que
    // existen porque son las que se declaran en cada llamada.
    const guiaX = createAnimatable(vertical, { x: { duration: 450, ease: "out(4)" } }) as unknown as Record<"x", Animador>;
    const guiaY = createAnimatable(horizontal, { y: { duration: 450, ease: "out(4)" } }) as unknown as Record<"y", Animador>;
    const marca = createAnimatable(celda, {
      x: { duration: 180, ease: "out(3)" },
      y: { duration: 180, ease: "out(3)" },
    }) as unknown as Record<"x" | "y", Animador>;

    let primera = true;

    function seguir(evento: PointerEvent) {
      const caja = heroe!.getBoundingClientRect();
      const x = evento.clientX - caja.left;
      const y = evento.clientY - caja.top;

      // La primera vez, todo nace donde está el cursor en lugar de cruzar el
      // héroe desde la esquina.
      const duracion = primera ? 0 : undefined;
      primera = false;

      guiaX.x(x, duracion);
      guiaY.y(y, duracion);
      // La celda salta de casilla en casilla, alineada a la cuadrícula.
      marca.x(Math.floor(x / CELDA) * CELDA, duracion);
      marca.y(Math.floor(y / CELDA) * CELDA, duracion);

      heroe!.style.setProperty("--giro-registro", `${(x / caja.width) * GIRO_MAXIMO}deg`);
      capa!.dataset.activa = "";
    }

    function soltar() {
      delete capa!.dataset.activa;
      heroe!.style.setProperty("--giro-registro", "0deg");
    }

    heroe.addEventListener("pointermove", seguir);
    heroe.addEventListener("pointerleave", soltar);
    // Si la ventana pierde el foco (otra app, una captura de pantalla), el
    // cursor ya no está aquí aunque el héroe no se haya enterado: sin esto
    // las guías se quedaban clavadas donde se fue el ratón.
    window.addEventListener("blur", soltar);
    return () => {
      heroe.removeEventListener("pointermove", seguir);
      heroe.removeEventListener("pointerleave", soltar);
      window.removeEventListener("blur", soltar);
    };
  }, []);

  return (
    <div
      ref={capaRef}
      className="absolute inset-0 overflow-hidden opacity-0 transition-opacity duration-500 data-[activa]:opacity-100"
    >
      <span ref={verticalRef} className="absolute inset-y-0 left-0 w-px bg-ink-inverted/20" />
      <span ref={horizontalRef} className="absolute inset-x-0 top-0 h-px bg-ink-inverted/20" />
      <span ref={celdaRef} className="absolute left-0 top-0 h-6 w-6 border border-accent/70 bg-accent/15" />
    </div>
  );
}
