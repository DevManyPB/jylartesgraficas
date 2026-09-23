"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccountButton, type IdentidadHeader } from "./AccountButton";
import { Marca } from "./Marca";
import { MobileMenu } from "./MobileMenu";
import { navItems } from "./nav-items";
import { useHeaderScroll } from "./use-header-scroll";

interface SiteHeaderProps {
  /** Lo resuelve el layout en el servidor: así el botón de cuenta sale bien
   *  en el primer pintado, sin parpadear de «Entrar» a la inicial. */
  identidad: IdentidadHeader | null;
  /** Para el pie del menú móvil, que lleva los datos de contacto (§4.2). */
  contacto: { whatsapp: string | null; telefono: string; email: string; redes: [string, string][] };
}

/** Largo de la línea que marca la página: corta, como pide SPEC.md §4.2. */
const ANCHO_LINEA = 16;

/**
 * SPEC.md §4.2. El estado visual lo decide el CSS a partir de los atributos
 * que `useHeaderScroll` escribe en <body>:
 * - sobre el héroe y sin haberlo pasado → transparente, texto claro
 * - en cualquier otro caso → sólido con desenfoque y línea inferior de 1px
 */
export function SiteHeader({ identidad, contacto }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const enlacesRef = useRef<HTMLDivElement>(null);
  const lineaRef = useRef<HTMLSpanElement>(null);
  useHeaderScroll(menuOpen);

  /*
    Una sola línea para toda la navegación. Descansa bajo la página actual
    y, al pasar el ratón o el foco por otro enlace, se desliza hasta él; al
    salir, vuelve. Antes cada enlace tenía su rayita y nada decía que eran
    un mismo menú.

    Se mueve escribiendo el estilo directamente y no con estado de React:
    así pasar el ratón no re-renderiza el header, y la animación es solo un
    `transform`, que lleva el compositor.
  */
  const moverLinea = useCallback((enlace: HTMLElement | null) => {
    const linea = lineaRef.current;
    if (!linea) return;
    if (!enlace) {
      linea.style.opacity = "0";
      return;
    }
    const x = enlace.offsetLeft + enlace.offsetWidth / 2 - ANCHO_LINEA / 2;
    linea.style.transform = `translateX(${x}px)`;
    linea.style.opacity = "1";
  }, []);

  const volverALaActual = useCallback(() => {
    moverLinea(enlacesRef.current?.querySelector<HTMLElement>('[aria-current="page"]') ?? null);
  }, [moverLinea]);

  useEffect(() => {
    volverALaActual();
    // La primera colocación no se anima: la línea tiene que nacer en su
    // sitio, no llegar volando desde la izquierda. A partir de aquí sí, y
    // al cambiar de página se desliza hasta la nueva, que es lo que cambió.
    const frame = requestAnimationFrame(() => {
      if (lineaRef.current) lineaRef.current.dataset.lista = "";
    });
    // La tipografía cambia el ancho de los enlaces al cargar, y la ventana
    // al redimensionar: en los dos casos hay que volver a medir.
    void document.fonts?.ready.then(volverALaActual);
    window.addEventListener("resize", volverALaActual);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", volverALaActual);
    };
  }, [pathname, volverALaActual]);

  return (
    <>
      {/*
        `pr-[var(--removed-body-scroll-bar-size,0px)]`: cuando un modal
        bloquea el scroll del fondo, Radix compensa el ancho de la barra
        con un `padding-right` en <body>. El header está fijo y no es hijo
        de ese flujo, así que sin esto se quedaba 15 px más ancho que la
        página y el contenido saltaba. SPEC.md §5.3 pide justo que no salte.
      */}
      <header className="fixed inset-x-0 top-0 z-50 pr-[var(--removed-body-scroll-bar-size,0px)] transition-transform duration-300 motion-reduce:transition-none group-[[data-header-hidden]]:-translate-y-full">
        {/* Capa sólida. Sin sombra: el SPEC solo admite la línea de 1px. */}
        <div
          aria-hidden
          className="absolute inset-0 border-b border-border bg-canvas/80 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none group-[&:has([data-hero]):not([data-past-hero])]:opacity-0"
        />

        {/* Cuánto se lleva leído. Se escala con una variable que el hook de
            scroll actualiza en su mismo fotograma, así que la anima el
            compositor y no repinta nada. En el color del texto y no en el
            de acento: «Entrar» es el único acento del header (§4.2). */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-[var(--progreso-scroll,0)] bg-ink opacity-30 transition-opacity duration-300 group-[&:has([data-hero]):not([data-past-hero])]:opacity-0"
        />

        <div className="relative mx-auto flex h-16 w-full max-w-content items-center justify-between px-6 text-ink transition-[color,height] duration-300 motion-reduce:transition-none group-[&:has([data-hero]):not([data-past-hero])]:text-ink-inverted sm:h-20 sm:group-[[data-desplazado]]:h-16 lg:px-8">
          <Marca />

          <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
            <div
              ref={enlacesRef}
              onPointerLeave={volverALaActual}
              onBlur={(evento) => {
                if (!evento.currentTarget.contains(evento.relatedTarget)) volverALaActual();
              }}
              className="relative flex items-center gap-8"
            >
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onPointerEnter={(evento) => moverLinea(evento.currentTarget)}
                    onFocus={(evento) => moverLinea(evento.currentTarget)}
                    className="py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    {item.label}
                  </Link>
                );
              })}
              <span
                ref={lineaRef}
                aria-hidden
                style={{ width: ANCHO_LINEA, opacity: 0 }}
                className="pointer-events-none absolute -bottom-1 left-0 h-0.5 bg-current motion-safe:data-[lista]:transition-[transform,opacity] motion-safe:data-[lista]:duration-300 motion-safe:data-[lista]:ease-entrada"
              />
            </div>

            <AccountButton identidad={identidad} />
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current md:hidden"
          >
            <span aria-hidden className="absolute h-px w-6 -translate-y-[5px] bg-current" />
            <span aria-hidden className="absolute h-px w-6 translate-y-[5px] bg-current" />
          </button>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        triggerRef={menuButtonRef}
        identidad={identidad}
        contacto={contacto}
      />
    </>
  );
}
