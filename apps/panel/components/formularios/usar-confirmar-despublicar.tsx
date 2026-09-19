"use client";

import { ConfirmDialog } from "@jyl/ui";
import { useState } from "react";

/**
 * SPEC.md §6.7: despublicar algo de la tienda o del portafolio pide
 * confirmación en modal. Se engancha al guardar: si el formulario llega con la
 * casilla de publicado recién desmarcada, primero pregunta y solo guarda si
 * se confirma.
 */
export function useConfirmarDespublicar(nombre: string, lugar: "la tienda" | "el portafolio") {
  const [pendiente, setPendiente] = useState<(() => Promise<boolean>) | null>(null);

  /** Guarda directo, o pregunta primero si el cambio despublica. */
  function guardarConfirmando(estabaPublicado: boolean, quedaPublicado: boolean, guardar: () => Promise<boolean>) {
    if (estabaPublicado && !quedaPublicado) setPendiente(() => guardar);
    else void guardar();
  }

  const dialogo = (
    <ConfirmDialog
      open={pendiente !== null}
      onOpenChange={(abierto) => !abierto && setPendiente(null)}
      title={`¿Despublicar «${nombre}»?`}
      description={`Deja de verse en ${lugar} en cuanto guardes. No se borra nada: puedes volver a publicarlo cuando quieras.`}
      confirmLabel="Despublicar y guardar"
      onConfirm={async () => {
        const ok = await pendiente?.();
        // Si no se guardó, el formulario ya dijo por qué; el modal sigue abierto.
        if (!ok) throw new Error("no-guardado");
      }}
    />
  );

  return { guardarConfirmando, dialogo };
}
