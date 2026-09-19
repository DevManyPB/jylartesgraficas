"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { RefObject } from "react";
import { navItems, primaryAction } from "./nav-items";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identidad: string | null;
  /** El botón que abrió el menú: Radix solo devuelve el foco solo si se usa
   *  <Dialog.Trigger>, y aquí el botón vive en el header. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Menú a pantalla completa desde la derecha — SPEC.md §4.2.
 * Usa Radix Dialog directamente (no el Modal de packages/ui, cuyo chrome es
 * de hoja de confirmación) para heredar foco atrapado, Esc y bloqueo de
 * scroll del fondo sin deformar aquel primitivo.
 */
export function MobileMenu({ open, onOpenChange, triggerRef, identidad }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* El panel es opaco, pero el overlay es lo que aporta el bloqueo de
            scroll del fondo en Radix, y además oscurece mientras entra. */}
        <Dialog.Overlay className="fixed inset-0 z-[55] bg-canvas-dark/60 motion-safe:data-[state=open]:animate-overlay-in motion-safe:data-[state=closed]:animate-overlay-out" />
        <Dialog.Content
          aria-describedby={undefined}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
          }}
          className="fixed inset-0 z-[60] flex flex-col bg-canvas-dark text-ink-inverted outline-none motion-safe:data-[state=open]:animate-menu-in motion-safe:data-[state=closed]:animate-menu-out"
        >
          <Dialog.Title className="sr-only">Menú de navegación</Dialog.Title>

          <div className="mx-auto flex h-16 w-full max-w-content shrink-0 items-center justify-between px-6 sm:h-20 lg:px-8">
            <Link
              href="/"
              onClick={() => onOpenChange(false)}
              className="flex flex-col rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
            >
              <span className="font-display text-xl font-bold leading-none">JYL</span>
              <span className="text-xs leading-none opacity-70">artes gráficas</span>
            </Link>

            <Dialog.Close
              aria-label="Cerrar menú"
              className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <span
                aria-hidden
                className="absolute h-px w-6 rotate-45 bg-current motion-safe:animate-menu-line-top"
              />
              <span
                aria-hidden
                className="absolute h-px w-6 -rotate-45 bg-current motion-safe:animate-menu-line-bottom"
              />
            </Dialog.Close>
          </div>

          <nav className="mx-auto flex w-full max-w-content flex-1 flex-col px-6 pt-6 lg:px-8">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center py-4 font-display text-3xl leading-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                >
                  {item.label}
                  {active && (
                    <span aria-hidden className="ml-3 h-0.5 w-5 self-end bg-current" />
                  )}
                </Link>
              );
            })}

            <Link
              href={identidad ? "/mi-cuenta" : "/entrar"}
              onClick={() => onOpenChange(false)}
              className="flex items-center py-4 text-base text-ink-inverted/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
            >
              {identidad ? `Mi cuenta · ${identidad}` : "Entrar"}
            </Link>

            <Link
              href={primaryAction.href}
              onClick={() => onOpenChange(false)}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-base font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              {primaryAction.label}
            </Link>
          </nav>

          {/* TODO: contenido pendiente del cliente — teléfono, correo y redes
              salen de settings/general (SPEC.md §4.6), disponible desde el Chunk E. */}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
