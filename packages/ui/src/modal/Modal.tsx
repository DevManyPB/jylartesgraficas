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

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
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
          onEscapeKeyDown={(event) => {
            if (locked) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            triggerRef.current?.focus();
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
