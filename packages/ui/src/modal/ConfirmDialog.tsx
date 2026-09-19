"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Modal } from "./Modal";

type ConfirmationRequirement = { type: "phrase"; phrase: string } | { type: "reason" };

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** La pregunta, con el nombre real del elemento. Nunca "¿Estás seguro?" — SPEC.md §5.2. */
  title: string;
  /** La consecuencia. No repite el título. */
  description: ReactNode;
  /** El verbo de la acción: Emitir, Anular, Eliminar. Nunca "Aceptar". */
  confirmLabel: string;
  cancelLabel?: string;
  /** Mientras esté pendiente, el modal no se puede cerrar. */
  onConfirm: (reason?: string) => Promise<void> | void;
  variant?: "default" | "destructive";
  /** Solo con variant="destructive": exige escribir el nombre exacto o un motivo libre — SPEC.md §5.2. */
  confirmationRequirement?: ConfirmationRequirement;
  /** Contenido extra entre la descripción y el campo, p. ej. el total de una factura. */
  extra?: ReactNode;
  /**
   * Una tercera salida, entre cancelar y confirmar. Existe para "Salir con
   * cambios sin guardar" (SPEC.md §5.1), que pide ofrecer guardar: ahí
   * confirmar es *Guardar y salir* y la alternativa es *Salir sin guardar*.
   */
  alternative?: { label: string; onSelect: () => void };
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  variant = "default",
  confirmationRequirement,
  extra,
  alternative,
}: ConfirmDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const inputId = useId();

  const isDestructive = variant === "destructive";
  const requiresPhrase = confirmationRequirement?.type === "phrase";
  const requiresReason = confirmationRequirement?.type === "reason";

  const canConfirm =
    !isSubmitting &&
    (!requiresPhrase ||
      (confirmationRequirement?.type === "phrase" && typedValue.trim() === confirmationRequirement.phrase)) &&
    (!requiresReason || typedValue.trim().length >= 3);

  const handleOpenChange = (next: boolean) => {
    if (isSubmitting) return;
    if (!next) setTypedValue("");
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    try {
      await onConfirm(requiresReason ? typedValue.trim() : undefined);
      setTypedValue("");
      onOpenChange(false);
    } catch {
      // Si la acción falla, el modal se queda abierto para poder reintentar;
      // el mensaje de error lo pone quien llama, que es quien sabe qué pasó.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      locked={isSubmitting}
      closeOnOutsideClick={!isDestructive}
      size="sm"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <Modal.Title className="font-display text-xl leading-tight text-ink">{title}</Modal.Title>
          <Modal.Close
            disabled={isSubmitting}
            aria-label="Cerrar"
            className="shrink-0 text-ink-subtle transition hover:text-ink disabled:pointer-events-none disabled:opacity-40"
          >
            ✕
          </Modal.Close>
        </div>

        <Modal.Description className="text-sm text-ink-muted">{description}</Modal.Description>

        {extra}

        {(requiresPhrase || requiresReason) && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={inputId} className="text-sm font-medium text-ink">
              {requiresPhrase && confirmationRequirement?.type === "phrase"
                ? `Escribe "${confirmationRequirement.phrase}" para confirmar`
                : "Motivo"}
            </label>
            <input
              id={inputId}
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
              className="rounded-lg border border-border-strong bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-60"
            />
          </div>
        )}

        <div className="mt-2 flex flex-wrap justify-end gap-3">
          <Modal.Close asChild>
            <button
              type="button"
              autoFocus
              disabled={isSubmitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-canvas-sunken disabled:pointer-events-none disabled:opacity-40"
            >
              {cancelLabel}
            </button>
          </Modal.Close>
          {alternative && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                alternative.onSelect();
                onOpenChange(false);
              }}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas-sunken disabled:pointer-events-none disabled:opacity-40"
            >
              {alternative.label}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-ink-inverted transition disabled:pointer-events-none disabled:opacity-40",
              isDestructive ? "bg-danger hover:bg-danger/90" : "bg-accent hover:bg-accent-hover",
            )}
          >
            {isSubmitting ? "Un momento…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
