"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ConfirmDialog } from "@jyl/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type RefObject, useState } from "react";
import {
  IconoCorreo,
  IconoPanel,
  IconoRecibo,
  IconoSalir,
  IconoTelefono,
  IconoWhatsapp,
} from "@/components/iconos/Iconos";
import { cerrarSesion } from "@/lib/cerrar-sesion";
import type { IdentidadHeader } from "./AccountButton";
import { navItems } from "./nav-items";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identidad: IdentidadHeader | null;
  contacto: { whatsapp: string | null; telefono: string; email: string; redes: [string, string][] };
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
export function MobileMenu({ open, onOpenChange, triggerRef, identidad, contacto }: MobileMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const nombre = identidad?.nombre?.trim() || identidad?.email || null;

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
              href="/pedido"
              onClick={() => onOpenChange(false)}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-5 py-3.5 text-base font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              Pedir un trabajo
            </Link>

            {/* La cuenta, abajo y separada de los destinos: aquí es donde se
                entra y, sobre todo, donde se sale — antes no había manera de
                cerrar sesión desde el móvil sin ir a «Mi cuenta». */}
            <div className="mt-6 border-t border-ink-inverted/15 pt-4">
              {nombre ? (
                <>
                  <p className="truncate text-sm text-ink-inverted/50">{nombre}</p>
                  {identidad?.panel && (
                    <a
                      href={identidad.panel}
                      onClick={() => onOpenChange(false)}
                      className="mt-2 flex items-center gap-3 py-2 text-base font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                      <IconoPanel className="h-5 w-5" />
                      Ir al panel del estudio
                    </a>
                  )}
                  <Link
                    href="/mi-cuenta"
                    onClick={() => onOpenChange(false)}
                    className="mt-2 flex items-center gap-3 py-2 text-base text-ink-inverted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    <IconoRecibo className="h-5 w-5 opacity-70" />
                    Mis pedidos y facturas
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setConfirmar(true);
                    }}
                    className="flex items-center gap-3 py-2 text-base text-ink-inverted/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                  >
                    <IconoSalir className="h-5 w-5" />
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/entrar"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-center rounded-full border border-ink-inverted/30 px-5 py-3 text-base font-medium text-ink-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                >
                  Entrar
                </Link>
              )}
            </div>
          </nav>

          {/* Los datos de contacto cierran el menú — SPEC.md §4.2. Salen de
              Configuración; lo que el estudio no haya puesto, no aparece. */}
          {(contacto.whatsapp || contacto.telefono || contacto.email || contacto.redes.length > 0) && (
            <div className="mx-auto w-full max-w-content shrink-0 px-6 pb-8 pt-6 lg:px-8">
              <ul className="flex flex-col gap-3 text-sm text-ink-inverted/70">
                {contacto.whatsapp && (
                  <li>
                    <a
                      href={contacto.whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                      <IconoWhatsapp className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </li>
                )}
                {contacto.telefono && (
                  <li>
                    <a
                      href={`tel:${contacto.telefono.replace(/\s/g, "")}`}
                      className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                      <IconoTelefono className="h-4 w-4" />
                      {contacto.telefono}
                    </a>
                  </li>
                )}
                {contacto.email && (
                  <li>
                    <a
                      href={`mailto:${contacto.email}`}
                      className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                    >
                      <IconoCorreo className="h-4 w-4" />
                      {contacto.email}
                    </a>
                  </li>
                )}
              </ul>

              {contacto.redes.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-4 text-sm text-ink-inverted/70">
                  {contacto.redes.map(([red, url]) => (
                    <li key={red}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="capitalize underline-offset-4 hover:text-ink-inverted hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
                      >
                        {red}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>

      <ConfirmDialog
        open={confirmar}
        onOpenChange={setConfirmar}
        title="¿Cerrar la sesión?"
        description="Tendrás que volver a entrar para ver tus pedidos y tus facturas."
        confirmLabel="Cerrar sesión"
        onConfirm={async () => {
          await cerrarSesion();
          router.push("/");
          router.refresh();
        }}
      />
    </Dialog.Root>
  );
}
