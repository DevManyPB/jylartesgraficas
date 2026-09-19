import { NOMBRE_ESTADO, type EstadoPedido } from "@jyl/core";
import { cn } from "@jyl/ui";

/**
 * El color dice cuánto pide atención, no decora: el acento solo para lo que
 * nadie ha tocado (SPEC.md §9, un solo acento usado con intención), tonos de
 * aviso mientras se negocia, neutro mientras se produce, verde cuando está
 * listo para entregar, y apagado cuando ya se cerró.
 */
const TONO: Record<EstadoPedido, string> = {
  recibido: "bg-accent-soft text-accent",
  en_revision: "bg-warning-soft text-warning",
  cotizado: "bg-warning-soft text-warning",
  aprobado: "bg-canvas-sunken text-ink",
  en_produccion: "bg-canvas-sunken text-ink",
  listo: "bg-success-soft text-success",
  entregado: "bg-canvas-sunken text-ink-subtle",
};

export function EstadoPedido({ estado, className }: { estado: EstadoPedido; className?: string }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium", TONO[estado], className)}>
      {NOMBRE_ESTADO[estado]}
    </span>
  );
}
