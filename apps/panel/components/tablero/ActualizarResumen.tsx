"use client";

import { useToast } from "@jyl/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatearFechaCorta } from "@/components/pedidos/formato";

/**
 * Las cifras se recalculan solas cuando el resumen guardado se queda viejo
 * (unos minutos). Este botón es para cuando alguien acaba de cambiar algo y
 * quiere verlo ya, sin esperar.
 */
export function ActualizarResumen({ actualizadoEn }: { actualizadoEn: string | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const [actualizando, setActualizando] = useState(false);

  async function actualizar() {
    setActualizando(true);
    const respuesta = await fetch("/api/resumen", { method: "POST" }).catch(() => null);
    setActualizando(false);

    if (!respuesta?.ok) {
      toast({ title: "No se pudieron actualizar las cifras", description: "Inténtalo de nuevo.", variant: "error" });
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="text-xs text-ink-subtle">
        {actualizadoEn ? `Cifras del ${formatearFechaCorta(actualizadoEn)}` : "Cifras sin calcular"}
      </p>
      <button
        type="button"
        onClick={actualizar}
        disabled={actualizando}
        className="rounded-md border border-border-strong px-3 py-1 text-sm text-ink transition-colors hover:bg-canvas-sunken disabled:opacity-60"
      >
        {actualizando ? "Actualizando…" : "Actualizar"}
      </button>
    </div>
  );
}
