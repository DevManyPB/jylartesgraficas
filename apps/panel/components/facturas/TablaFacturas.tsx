import type { FilaFactura } from "@jyl/core";
import Link from "next/link";
import { formatearFechaCorta, pesos } from "@/components/pedidos/formato";
import { EstadoFactura } from "./EstadoFactura";

/** Lista densa de facturas, con la misma forma que la de pedidos: en móvil cada fila se apila. */
export function TablaFacturas({ filas }: { filas: FilaFactura[] }) {
  return (
    <div className="border-y border-border">
      <table className="w-full text-sm">
        <thead className="sr-only md:not-sr-only">
          <tr className="text-left text-xs text-ink-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Factura</th>
            <th scope="col" className="py-2 pr-4 font-medium">Cliente</th>
            <th scope="col" className="py-2 pr-4 font-medium">Estado</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Total</th>
            <th scope="col" className="py-2 pr-4 text-right font-medium">Por cobrar</th>
            <th scope="col" className="py-2 font-medium">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.id}
              className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 border-t border-border py-2.5 md:table-row md:py-0"
            >
              <td className="md:py-2.5 md:pr-4">
                <Link
                  href={`/facturas/${fila.id}`}
                  className="font-medium tabular-nums text-ink underline-offset-2 hover:underline focus-visible:underline"
                >
                  {fila.numero ?? "Sin número"}
                </Link>
              </td>
              <td className="col-start-1 text-ink md:py-2.5 md:pr-4">{fila.cliente || "Sin nombre"}</td>
              <td className="col-start-2 row-start-1 text-right md:py-2.5 md:pr-4 md:text-left">
                <EstadoFactura estado={fila.estado} />
              </td>
              <td className="col-start-2 row-start-2 text-right tabular-nums text-ink md:py-2.5 md:pr-4">
                {pesos.format(fila.total)}
              </td>
              <td className="col-start-1 text-xs tabular-nums text-ink-muted md:py-2.5 md:pr-4 md:text-right md:text-sm">
                {fila.saldo > 0 ? (
                  <>
                    <span className="md:sr-only">Por cobrar: </span>
                    {pesos.format(fila.saldo)}
                  </>
                ) : (
                  <span className="hidden md:inline">—</span>
                )}
              </td>
              <td className="col-start-2 whitespace-nowrap text-right text-xs text-ink-muted md:py-2.5 md:text-left md:text-sm">
                {formatearFechaCorta(fila.emitidaEn ?? fila.creadaEn)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
