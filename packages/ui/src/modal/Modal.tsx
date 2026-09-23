"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { useModalGuard } from "./ModalProvider";
import { useDragToClose } from "./use-drag-to-close";

/** "visor": para ver una imagen a tamaño completo (SPEC.md §5.1). */
export type ModalSize = "sm" | "md" | "lg" | "visor";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  size?: ModalSize;
  /** Clic fuera cierra por defecto. Desactivar en destructivos o formularios a medio llenar — SPEC.md §5.3. */
  closeOnOutsideClick?: boolean;
  /** Mientras es true no se puede cerrar (acción en curso): ni Esc, ni clic fuera, ni la X. */
  locked?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  visor: "sm:max-w-[min(92vw,72rem)]",
};

export function Modal({
  open,
  onOpenChange,
  children,
  size = "md",
  closeOnOutsideClick = true,
  locked = false,
}: ModalProps) {
  const id = useId();
  const { requestOpen, release } = useModalGuard();
  const [allowed, setAllowed] = useState(false);
  const { dragOffset, dragHandlers } = useDragToClose(() => onOpenChange(false));

  // Radix solo devuelve el foco al disparador si se abre con <Dialog.Trigger>.
  // Esta API es controlada desde afuera (sin Trigger), así que capturamos y
  // restauramos el foco nosotros — SPEC.md §5.3.
  const triggerRef = useRef<HTMLElement | null>(null);
  const triggerInfoRef = useRef<{ id?: string; text?: string; ariaLabel?: string } | null>(null);

  useEffect(() => {
    if (open) {
      const el = document.activeElement as HTMLElement | null;
      triggerRef.current = el;
      if (el) {
        triggerInfoRef.current = {
          id: el.id || undefined,
          text: el.textContent?.trim() || undefined,
          ariaLabel: el.getAttribute("aria-label") || undefined,
        };
      }
      setAllowed(requestOpen(id));
    } else {
      release(id);
      setAllowed(false);
    }
    return () => release(id);
  }, [open, id, requestOpen, release]);

  const isOpen = open && allowed;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (locked) return;
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-40 bg-canvas-dark/60",
            "data-[state=open]:motion-safe:animate-overlay-in",
            "data-[state=closed]:motion-safe:animate-overlay-out",
          )}
        />
        <Dialog.Content
          // Radix no lo pone: esconde el resto de la página con aria-hidden,
          // pero SPEC.md §5.3 y AGENTS.md §7 piden el atributo explícito, que
          // es lo que les dice a los lectores de pantalla que el fondo no
          // está disponible mientras el modal esté abierto.
          aria-modal="true"
          onOpenAutoFocus={(event) => {
            const target = event.currentTarget as HTMLElement | null;
            if (!target) return;

            // 1. Respetar autofocus explícito si existe
            const explicit = target.querySelector<HTMLElement>("[autofocus], [data-autofocus]");
            if (explicit) {
              event.preventDefault();
              explicit.focus();
              return;
            }

            // 2. En formularios, el foco va al primer campo y no a la ✕ (SPEC.md §5.3 / AGENTS.md §7)
            const primerCampo = target.querySelector<HTMLElement>(
              'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([disabled]), textarea:not([disabled]), select:not([disabled])',
            );
            if (primerCampo) {
              event.preventDefault();
              primerCampo.focus();
              return;
            }

            // 3. Si no hay campos, buscar un botón que no sea la ✕ de cerrar
            const botones = Array.from(
              target.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
              ),
            );
            const noCerrar = botones.find((el) => {
              const esCerrar =
                el.getAttribute("aria-label") === "Cerrar" ||
                el.textContent?.trim() === "✕";
              return !esCerrar;
            });
            if (noCerrar) {
              event.preventDefault();
              noCerrar.focus();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (locked) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // Restaurar foco al disparador original si aún existe en el DOM
            if (triggerRef.current && document.body.contains(triggerRef.current)) {
              triggerRef.current.focus();
              return;
            }

            // Si el botón desapareció (ej. pantalla vacía que ahora muestra la lista),
            // buscar un botón equivalente por id, aria-label o texto
            const info = triggerInfoRef.current;
            let reintento: HTMLElement | null = null;
            if (info?.id) {
              reintento = document.getElementById(info.id);
            }
            if (!reintento && info?.ariaLabel) {
              reintento = document.querySelector<HTMLElement>(`button[aria-label="${CSS.escape(info.ariaLabel)}"]`);
            }
            if (!reintento && info?.text) {
              const candidatos = Array.from(document.querySelectorAll<HTMLElement>("main button, main a"));
              reintento = candidatos.find((b) => b.textContent?.trim() === info.text) ?? null;
            }
            if (!reintento) {
              const candidatos = Array.from(document.querySelectorAll<HTMLElement>("main button, main a"));
              reintento =
                candidatos.find((b) => /nuevo|agregar|crear/i.test(b.textContent || "")) ??
                candidatos[0] ??
                document.querySelector<HTMLElement>("main");
            }
            if (reintento) {
              if (reintento.tagName.toLowerCase() === "main" && !reintento.hasAttribute("tabindex")) {
                reintento.setAttribute("tabindex", "-1");
              }
              reintento.focus();
            }
          }}
          onPointerDownOutside={(event) => {
            if (locked || !closeOnOutsideClick) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (locked || !closeOnOutsideClick) event.preventDefault();
          }}
          style={dragOffset ? { transform: `translateY(${dragOffset}px)` } : undefined}
          className={cn(
            "fixed z-50 w-full bg-canvas text-ink shadow-xl outline-none",
            "inset-x-0 bottom-0 rounded-t-2xl border-t border-border",
            "data-[state=open]:motion-safe:animate-content-in-sheet",
            "data-[state=closed]:motion-safe:animate-content-out-sheet",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border",
            "sm:data-[state=open]:motion-safe:animate-content-in-center",
            "sm:data-[state=closed]:motion-safe:animate-content-out-center",
            sizeClasses[size],
          )}
        >
          <div
            aria-hidden
            className="mx-auto mt-2 h-1 w-10 shrink-0 touch-none rounded-full bg-border-strong sm:hidden"
            {...dragHandlers}
          />
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

Modal.Title = Dialog.Title;
Modal.Description = Dialog.Description;
Modal.Close = Dialog.Close;
