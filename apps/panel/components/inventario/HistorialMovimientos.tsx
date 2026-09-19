import { NOMBRE_MOVIMIENTO, type MovimientoDelPanel } from "@jyl/core";
import { cn } from "@jyl/ui";
import Link from "next/link";
import { formatearFechaCorta } from "@/components/pedidos/formato";

/** Quién, cuándo, cuánto y por qué — SPEC.md §6.4. Los 25 más recientes. */
export function HistorialMovimientos({ movimientos, mostrarDe = true }: { movimientos: MovimientoDelPanel[]; mostrarDe?: boolean }) {
  if (movimientos.length === 0) return <p className="text-sm text-ink-muted">Sin movimientos todavía.</p>;

  return (
    <div className="overflow-x-auto border-y border-border">
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-muted">
            <th scope="col" className="py-2 pr-3 font-medium">Cuándo</th>
            {mostrarDe && <th scope="col" className="py-2 pr-3 font-medium">Qué</th>}
            <th scope="col" className="py-2 pr-3 font-medium">Movimiento</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Cambio</th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">Quedó</th>
            <th scope="col" className="py-2 font-medium">Motivo</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => (
            <tr key={m.id} className="border-t border-border align-top">
              <td className="whitespace-nowrap py-2 pr-3 text-ink-muted">
                {formatearFechaCorta(m.creadoEn)}
                {m.autor && <span className="block text-xs text-ink-subtle">{m.autor}</span>}
              </td>
              {mostrarDe && <td className="py-2 pr-3">{m.de}</td>}
              <td className="py-2 pr-3">{NOMBRE_MOVIMIENTO[m.tipo]}</td>
              <td className={cn("py-2 pr-3 text-right font-medium tabular-nums", m.delta > 0 ? "text-success" : "text-danger")}>
                {m.delta > 0 ? "+" : ""}
                {m.delta}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-ink-muted">{m.stockNuevo}</td>
              <td className="py-2 text-ink">
                {m.motivo}
                {m.orderId && (
                  <Link href={`/pedidos/${m.orderId}`} className="ml-1 text-xs text-accent hover:underline">
                    Ver pedido
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
