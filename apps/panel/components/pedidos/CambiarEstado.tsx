"use client";

import { ESTADOS_PEDIDO, NOMBRE_ESTADO, type EstadoPedido } from "@jyl/core";
import { ConfirmDialog, useToast } from "@jyl/ui";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { claseEntrada } from "@/components/formularios/Campo";
import { enviarJson } from "@/components/formularios/enviar";

interface CambiarEstadoProps {
  pedidoId: string;
  numero: string;
  actual: EstadoPedido;
}

/**
 * Cambio de estado — SPEC.md §6.3. Pasar a Entregado pide confirmación
 * (§5.1): es el cierre del pedido. El resto se aplica directo, porque se
 * puede volver atrás y el historial guarda cada paso.
 */
export function CambiarEstado({ pedidoId, numero, actual }: CambiarEstadoProps) {
  const { toast } = useToast();
  const router = useRouter();
  const id = useId();
  const [estado, setEstado] = useState<EstadoPedido>(siguienteDe(actual));
  const [nota, setNota] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  async function aplicar(): Promise<void> {
    setGuardando(true);
    const resultado = await enviarJson(`/api/pedidos/${pedidoId}/estado`, "PUT", { estado, nota });
    setGuardando(false);

    if (!resultado.ok) {
      toast({ title: "No cambió el estado", description: resultado.error, variant: "error" });
      router.refresh();
      // Lanzar deja abierto el modal de confirmación, si lo había.
      throw new Error("no-aplicado");
    }

    toast({ title: `${numero}: ${NOMBRE_ESTADO[estado]}`, variant: "success" });
    setNota("");
    router.refresh();
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        if (estado === "entregado") setConfirmando(true);
        else aplicar().catch(() => undefined);
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor={`${id}-estado`} className="text-[13px] font-medium text-ink">
        Pasar a
      </label>
      <select
        id={`${id}-estado`}
        value={estado}
        onChange={(e) => setEstado(e.target.value as EstadoPedido)}
        className={claseEntrada}
      >
        {ESTADOS_PEDIDO.filter((e) => e !== actual).map((e) => (
          <option key={e} value={e}>
            {NOMBRE_ESTADO[e]}
          </option>
        ))}
      </select>

      <label htmlFor={`${id}-nota`} className="text-[13px] font-medium text-ink">
        Nota para el historial <span className="font-normal text-ink-subtle">(opcional)</span>
      </label>
      <input
        id={`${id}-nota`}
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        maxLength={500}
        placeholder="Ej.: cotización enviada por WhatsApp"
        className={claseEntrada}
      />

      <button
        type="submit"
        disabled={guardando}
        className="mt-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {guardando ? "Guardando…" : "Cambiar estado"}
      </button>

      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title={`¿Marcar ${numero} como entregado?`}
        description="El pedido queda cerrado y el cliente lo verá como entregado. Si fue un error, se puede volver a otro estado desde aquí."
        confirmLabel="Marcar entregado"
        onConfirm={aplicar}
      />
    </form>
  );
}

/** Lo más probable es avanzar un paso: se ofrece eso por defecto. */
function siguienteDe(actual: EstadoPedido): EstadoPedido {
  const i = ESTADOS_PEDIDO.indexOf(actual);
  return ESTADOS_PEDIDO[Math.min(i + 1, ESTADOS_PEDIDO.length - 1)] === actual
    ? ESTADOS_PEDIDO[Math.max(i - 1, 0)]!
    : ESTADOS_PEDIDO[i + 1]!;
}
