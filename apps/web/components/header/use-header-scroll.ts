"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const HEADER_HEIGHT_MOBILE = 64;
const HEADER_HEIGHT_DESKTOP = 80;
const SCROLL_DELTA = 8;

/**
 * Estado del header — SPEC.md §4.2. Se escribe en atributos de <body> en
 * lugar de estado de React: el CSS decide el aspecto, el primer pintado ya
 * sale correcto desde el servidor y no hay re-render por evento de scroll.
 *
 * - `data-past-hero`: el héroe ya pasó bajo el header → barra sólida.
 * - `data-header-hidden`: se bajó → el header se esconde hasta que se suba.
 * - `data-desplazado`: se ha movido algo de la parte de arriba → el header
 *   se encoge. A diferencia de `data-past-hero`, esto vale en todas las
 *   páginas, tengan héroe o no.
 * - `--progreso-scroll`: cuánto se lleva leído, de 0 a 1, para la línea de
 *   progreso. Se escribe en el mismo fotograma que lo demás en vez de en un
 *   segundo listener, que sería pagar dos veces por el mismo evento.
 *
 * Las páginas sin héroe no marcan nada: el CSS las trata como sólidas porque
 * no encuentra ningún `[data-hero]`.
 */
export function useHeaderScroll(menuOpen: boolean) {
  const pathname = usePathname();

  useEffect(() => {
    const hero = document.querySelector("[data-hero]");
    if (!hero) {
      delete document.body.dataset.pastHero;
      return;
    }

    const headerHeight = window.matchMedia("(min-width: 640px)").matches
      ? HEADER_HEIGHT_DESKTOP
      : HEADER_HEIGHT_MOBILE;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) delete document.body.dataset.pastHero;
        else document.body.dataset.pastHero = "";
      },
      { rootMargin: `-${headerHeight}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(hero);

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    // Con el menú abierto el header no se esconde: es el único modo de cerrarlo.
    if (menuOpen) {
      delete document.body.dataset.headerHidden;
      return;
    }

    let lastY = window.scrollY;
    let frame = 0;

    const medir = () => {
      const y = window.scrollY;

      // Encogido y progreso se actualizan siempre, aunque el movimiento sea
      // de un píxel: son continuos, no un umbral.
      if (y > 4) document.body.dataset.desplazado = "";
      else delete document.body.dataset.desplazado;

      const recorrido = document.documentElement.scrollHeight - window.innerHeight;
      const progreso = recorrido > 0 ? Math.min(y / recorrido, 1) : 0;
      document.body.style.setProperty("--progreso-scroll", String(progreso));

      // Arriba del todo el header siempre se ve, sin esperar al umbral.
      if (y <= HEADER_HEIGHT_DESKTOP) {
        lastY = y;
        delete document.body.dataset.headerHidden;
        return;
      }

      // Esconder el header sí necesita umbral: si no, tiembla con el rebote
      // del trackpad y con el rebote elástico del móvil.
      const delta = y - lastY;
      if (Math.abs(delta) < SCROLL_DELTA) return;
      lastY = y;

      if (delta < 0) delete document.body.dataset.headerHidden;
      else document.body.dataset.headerHidden = "";
    };

    // Una página nueva empieza con el header a la vista. El estado vive en
    // <body>, que no cambia al navegar: sin esto, si en la página anterior se
    // había escondido al bajar (los servicios del inicio llevan a /pedido),
    // la nueva abría sin header hasta que se subiera.
    delete document.body.dataset.headerHidden;

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        medir();
      });
    };

    // Una primera medida: al recargar a media página el header ya nace
    // encogido y la línea de progreso no arranca en cero.
    medir();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
    // `pathname` entra en la lista porque cada página tiene su propio alto:
    // el progreso hay que volver a medirlo al cambiar de una a otra.
  }, [menuOpen, pathname]);
}
