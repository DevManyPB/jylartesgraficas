"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
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

/** Opacidad del fondo que sigue al ratón: un velo del color del texto. */
const VELO = "0.1";

/**
 * SPEC.md §4.2 — barra flotante.
 *
 * Se despega de los bordes de la ventana: una cápsula con fondo translúcido,
 * desenfoque y borde de 1 px, sin sombra. Antes era texto suelto sobre la
 * página y se veía plano; la cápsula le da un objeto propio al header sin
 * tapar el trabajo que hay detrás.
 *
 * El estado visual lo decide el CSS a partir de los atributos que
 * `useHeaderScroll` escribe en <body>:
 * - sobre el héroe → cápsula clara casi transparente y texto claro
 * - en cualquier otro caso → cápsula blanca translúcida y texto en tinta
 */
export function SiteHeader({ identidad, contacto }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const fondoRef = useRef<HTMLSpanElement>(null);
  useHeaderScroll(menuOpen);

  /*
    Un fondo suave se desliza detrás del enlace que se apunta o se enfoca, y
    se desvanece al salir de la navegación. Dice «esto se pulsa» y une los
    cuatro enlaces en un solo objeto.

    Se mueve escribiendo el estilo directamente, sin estado de React: pasar
    el ratón no re-renderiza el header.
  */
  const apuntar = useCallback((enlace: HTMLElement) => {
    const fondo = fondoRef.current;
    if (!fondo) return;
    const oculto = fondo.style.opacity !== VELO;
    // Si estaba oculto, aparece ya en su sitio en vez de llegar deslizando
    // desde el último enlace que se apuntó.
    if (oculto) fondo.style.transition = "none";
    fondo.style.width = `${enlace.offsetWidth}px`;
    fondo.style.transform = `translateX(${enlace.offsetLeft}px)`;
    if (oculto) {
      void fondo.offsetWidth;
      fondo.style.transition = "";
    }
    fondo.style.opacity = VELO;
  }, []);

  const soltar = useCallback(() => {
    if (fondoRef.current) fondoRef.current.style.opacity = "0";
  }, []);

  return (
    <>
      {/*
        `pr-[var(--removed-body-scroll-bar-size,0px)]`: cuando un modal
        bloquea el scroll del fondo, Radix compensa el ancho de la barra
        con un `padding-right` en <body>. El header está fijo y no es hijo
        de ese flujo, así que sin esto se quedaba 15 px más ancho que la
        página y el contenido saltaba. SPEC.md §5.3 pide justo que no salte.
      */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 pr-[calc(0.75rem+var(--removed-body-scroll-bar-size,0px))] transition-transform duration-300 ease-entrada motion-reduce:transition-none group-[[data-header-hidden]]:-translate-y-[calc(100%+1.5rem)] sm:px-4 sm:pr-[calc(1rem+var(--removed-body-scroll-bar-size,0px))]">
        <div
          // Sobre el héroe (y sin haberlo pasado), cápsula casi transparente
          // con texto claro. Las clases van escritas enteras: Tailwind no ve
          // las que se arman con plantillas.
          className="relative mx-auto flex h-14 w-full max-w-content items-center justify-between overflow-hidden rounded-full border border-border bg-canvas/80 pl-5 pr-2 text-ink backdrop-blur-md transition-[color,background-color,border-color,height] duration-300 motion-reduce:transition-none group-[&:has([data-hero]):not([data-past-hero])]:border-ink-inverted/15 group-[&:has([data-hero]):not([data-past-hero])]:bg-ink-inverted/5 group-[&:has([data-hero]):not([data-past-hero])]:text-ink-inverted sm:h-16 sm:group-[[data-desplazado]]:h-14 md:pl-6"
        >
          <Marca />

          <nav aria-label="Principal" className="hidden items-center gap-3 md:flex">
            <div onPointerLeave={soltar} className="relative flex items-center">
              <span
                ref={fondoRef}
                aria-hidden
                style={{ opacity: 0 }}
                className="pointer-events-none absolute inset-y-0 left-0 rounded-full bg-current motion-safe:transition-[transform,width,opacity] motion-safe:duration-300 motion-safe:ease-entrada"
              />
              {navItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onPointerEnter={(evento) => apuntar(evento.currentTarget)}
                    onFocus={(evento) => apuntar(evento.currentTarget)}
                    onBlur={soltar}
                    className="relative rounded-full px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                  >
                    {item.label}
                    {/* La página actual: línea corta debajo (§4.2), fija. */}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute bottom-0.5 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-current"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            <AccountButton identidad={identidad} />
          </nav>

          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            className="relative flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current md:hidden"
          >
            <span aria-hidden className="absolute h-px w-5 -translate-y-[5px] bg-current" />
            <span aria-hidden className="absolute h-px w-5 translate-y-[5px] bg-current" />
          </button>

          {/* Cuánto se lleva leído: una línea fina en el borde inferior de la
              cápsula, en el color del texto — «Entrar» es el único acento
              del header (§4.2). La escala una variable que el hook de scroll
              actualiza en su mismo fotograma, así que no repinta nada. */}
          <span
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-[var(--progreso-scroll,0)] bg-current opacity-25 group-[&:has([data-hero]):not([data-past-hero])]:opacity-0"
          />
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
