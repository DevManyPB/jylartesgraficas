import { NOMBRE_ESTADO_FACTURA, type EstadoFactura as Estado } from "@jyl/core";
import { cn } from "@jyl/ui";

/**
 * Como en los pedidos, el color dice cuánto pide atención: una emitida es
 * plata por cobrar (aviso), una pagada ya cerró (éxito), un borrador todavía
 * no existe para el cliente (neutro) y una anulada no cuenta (apagado).
 */
const TONO: Record<Estado, string> = {
  borrador: "bg-canvas-sunken text-ink",
  emitida: "bg-warning-soft text-warning",
  pagada: "bg-success-soft text-success",
  anulada: "bg-canvas-sunken text-ink-subtle line-through",
};

export function EstadoFactura({ estado, className }: { estado: Estado; className?: string }) {
  return (
    <span className={cn("inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium", TONO[estado], className)}>
      {NOMBRE_ESTADO_FACTURA[estado]}
    </span>
  );
}
