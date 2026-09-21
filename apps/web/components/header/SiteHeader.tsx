"use client";

import { cn } from "@jyl/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { AccountButton, type IdentidadHeader } from "./AccountButton";
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
  useHeaderScroll(menuOpen);

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
            compositor y no repinta nada. */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-[var(--progreso-scroll,0)] bg-accent transition-opacity duration-300 group-[&:has([data-hero]):not([data-past-hero])]:opacity-0"
        />

        <div className="relative mx-auto flex h-16 w-full max-w-content items-center justify-between px-6 text-ink transition-[color,height] duration-300 motion-reduce:transition-none group-[&:has([data-hero]):not([data-past-hero])]:text-ink-inverted sm:h-20 sm:group-[[data-desplazado]]:h-16 lg:px-8">
          <Link
            href="/"
            className="flex flex-col rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
          >
            <span className="font-display text-xl font-bold leading-none">JYL</span>
            <span className="text-xs leading-none opacity-70">artes gráficas</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="group/nav relative py-1 text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                >
                  {item.label}
                  {/* La misma línea marca la página actual y responde al
                      ratón: en la actual está puesta, en las demás crece
                      desde el centro al pasar por encima. Antes solo la
                      activa tenía marca y nada decía que las otras se
                      pudieran pulsar. */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -bottom-1 left-1/2 h-0.5 -translate-x-1/2 bg-current transition-[width] duration-300 ease-entrada motion-reduce:transition-none",
                      active ? "w-4" : "w-0 group-hover/nav:w-4 group-focus-visible/nav:w-4",
                    )}
                  />
                </Link>
              );
            })}

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
