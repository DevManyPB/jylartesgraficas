import type { FilaPedido } from "@jyl/core";
import Link from "next/link";
import { EstadoPedido } from "./EstadoPedido";
import { formatearFechaCorta } from "./formato";

/**
 * Lista densa de pedidos — SPEC.md §9, el panel es para trabajar. En móvil
 * cada fila se apila; en escritorio es una tabla que se lee en horizontal.
 */
export function TablaPedidos({ filas }: { filas: FilaPedido[] }) {
  return (
    <div className="border-y border-border">
      <table className="w-full text-sm">
        <thead className="sr-only md:not-sr-only">
          <tr className="text-left text-xs text-ink-muted">
            <th scope="col" className="py-2 pr-4 font-medium">Pedido</th>
            <th scope="col" className="py-2 pr-4 font-medium">Cliente</th>
            <th scope="col" className="py-2 pr-4 font-medium">Servicio</th>
            <th scope="col" className="py-2 pr-4 font-medium">Estado</th>
            <th scope="col" className="py-2 font-medium">Recibido</th>
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
                  href={`/pedidos/${fila.id}`}
                  className="font-medium tabular-nums text-ink underline-offset-2 hover:underline focus-visible:underline"
                >
                  {fila.numero}
                </Link>
                {fila.archivosIncompletos && (
                  <span className="ml-2 text-xs text-warning" title="Algunas referencias no se subieron bien">
                    Faltan archivos
                  </span>
                )}
              </td>
              <td className="col-start-1 md:py-2.5 md:pr-4">
                <span className="text-ink">{fila.contacto.nombre || fila.contacto.email || "Sin nombre"}</span>
                {fila.contacto.telefono && (
                  <span className="ml-2 text-xs tabular-nums text-ink-muted md:ml-0 md:block">{fila.contacto.telefono}</span>
                )}
              </td>
              <td className="col-start-1 text-ink-muted md:py-2.5 md:pr-4">
                {fila.servicio ?? "Productos de la tienda"}
                {fila.archivos > 0 && <span className="ml-2 text-xs text-ink-subtle">{fila.archivos} arch.</span>}
              </td>
              <td className="col-start-2 row-start-1 text-right md:py-2.5 md:pr-4 md:text-left">
                <EstadoPedido estado={fila.estado} />
              </td>
              <td className="col-start-2 row-start-2 whitespace-nowrap text-right text-xs text-ink-muted md:py-2.5 md:text-left md:text-sm">
                {formatearFechaCorta(fila.creadoEn)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
