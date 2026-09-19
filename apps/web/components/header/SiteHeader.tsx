"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { AccountButton } from "./AccountButton";
import { MobileMenu } from "./MobileMenu";
import { navItems, primaryAction } from "./nav-items";
import { useHeaderScroll } from "./use-header-scroll";

interface SiteHeaderProps {
  /** Lo resuelve el layout en el servidor: así el botón de cuenta sale bien
   *  en el primer pintado, sin parpadear de «Entrar» a la inicial. */
  identidad: string | null;
}

/**
 * SPEC.md §4.2. El estado visual lo decide el CSS a partir de los atributos
 * que `useHeaderScroll` escribe en <body>:
 * - sobre el héroe y sin haberlo pasado → transparente, texto claro
 * - en cualquier otro caso → sólido con desenfoque y línea inferior de 1px
 */
export function SiteHeader({ identidad }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  useHeaderScroll(menuOpen);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 transition-transform duration-300 motion-reduce:transition-none group-[[data-header-hidden]]:-translate-y-full">
        {/* Capa sólida. Sin sombra: el SPEC solo admite la línea de 1px. */}
        <div
          aria-hidden
          className="absolute inset-0 border-b border-border bg-canvas/80 backdrop-blur-md transition-opacity duration-300 motion-reduce:transition-none group-[&:has([data-hero]):not([data-past-hero])]:opacity-0"
        />

        <div className="relative mx-auto flex h-16 w-full max-w-content items-center justify-between px-6 text-ink transition-colors duration-300 motion-reduce:transition-none group-[&:has([data-hero]):not([data-past-hero])]:text-ink-inverted sm:h-20 lg:px-8">
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
                  className="relative py-1 text-sm transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                >
                  {item.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 bg-current"
                    />
                  )}
                </Link>
              );
            })}

            <AccountButton identidad={identidad} />

            <Link
              href={primaryAction.href}
              className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {primaryAction.label}
            </Link>
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
      />
    </>
  );
}
