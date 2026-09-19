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

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY;
        const delta = y - lastY;
        if (Math.abs(delta) < SCROLL_DELTA) return;
        lastY = y;

        if (y <= HEADER_HEIGHT_DESKTOP || delta < 0) {
          delete document.body.dataset.headerHidden;
        } else {
          document.body.dataset.headerHidden = "";
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [menuOpen]);
}
