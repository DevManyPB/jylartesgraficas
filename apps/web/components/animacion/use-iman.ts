"use client";

import { createAnimatable, type AnimatableObject } from "animejs";
import { useEffect, useRef } from "react";

/**
 * El botón se inclina hacia el cursor, como si tirara de él, y vuelve a su
 * sitio con un muelle al salir — anime.js.
 *
 * Por qué una librería y no CSS: el CSS puede cambiar de color o de escala al
 * pasar por encima, pero no puede seguir al cursor ni frenar con física. Eso
 * es lo que hace que un botón se sienta vivo en vez de solo iluminado. El
 * color sí se deja en CSS, que va en el compositor y no cuesta nada.
 *
 * `createAnimatable` existe justo para esto: crea los animadores una vez y
 * cada movimiento del ratón solo les pasa un número, en vez de lanzar una
 * animación nueva en cada píxel.
 *
 * No se activa con dedo ni con `prefers-reduced-motion`: en una pantalla
 * táctil no hay cursor al que seguir, y a quien pidió menos movimiento no se
 * le persigue la mano por la pantalla.
 */

/** Cuánto se desplaza respecto a la distancia al centro. Poco, a propósito. */
const FUERZA = 0.22;
/** Tope en píxeles: por lejos que esté el cursor, el botón no se despega. */
const TOPE = 8;

const entre = (valor: number) => Math.max(-TOPE, Math.min(TOPE, valor));

export function useIman<T extends HTMLElement>() {
  const referencia = useRef<T>(null);

  useEffect(() => {
    const nodo = referencia.current;
    if (!nodo) return;

    const conCursor = window.matchMedia("(pointer: fine)").matches;
    const quiereMovimiento = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!conCursor || !quiereMovimiento) return;

    const animable: AnimatableObject = createAnimatable(nodo, {
      x: { duration: 320, ease: "out(3)" },
      y: { duration: 320, ease: "out(3)" },
      scale: { duration: 420, ease: "outElastic(1, .6)" },
    });

    // anime.js declara las propiedades como un índice abierto, y con
    // `noUncheckedIndexedAccess` cada una llega como "quizá undefined". Aquí
    // sí se sabe que existen: son las tres que se acaban de declarar arriba.
    const { x, y, scale } = animable as unknown as Record<"x" | "y" | "scale", (valor: number) => void>;

    function seguir(evento: PointerEvent) {
      const caja = nodo!.getBoundingClientRect();
      x(entre((evento.clientX - (caja.left + caja.width / 2)) * FUERZA));
      y(entre((evento.clientY - (caja.top + caja.height / 2)) * FUERZA));
      scale(1.04);
    }

    function soltar() {
      x(0);
      y(0);
      scale(1);
    }

    nodo.addEventListener("pointermove", seguir);
    nodo.addEventListener("pointerleave", soltar);
    // Si se pulsa y el puntero se va con el menú abierto, el botón se queda
    // torcido; al perder el foco también se recoge.
    nodo.addEventListener("blur", soltar);

    return () => {
      nodo.removeEventListener("pointermove", seguir);
      nodo.removeEventListener("pointerleave", soltar);
      nodo.removeEventListener("blur", soltar);
      animable.revert();
    };
  }, []);

  return referencia;
}
