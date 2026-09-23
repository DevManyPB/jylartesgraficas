"use client";

import { estadoDeStock, nombreDeVariante, type VarianteDelPanel } from "@jyl/core";
import { cn } from "@jyl/ui";
import { useState } from "react";
import { pesos } from "@/components/pedidos/formato";
import { FormularioVariante } from "./FormularioVariante";
import { RegistrarMovimiento } from "./RegistrarMovimiento";

interface TablaVariantesProps {
  productId: string;
  producto: string;
  variantes: VarianteDelPanel[];
  /** El operador mueve stock pero no ve costos ni edita (SPEC.md §6.1). */
  esAdmin: boolean;
}

function EstadoStock({ stock, minimo }: { stock: number; minimo: number }) {
  const estado = estadoDeStock(stock, minimo);
  return (
    <span className="whitespace-nowrap tabular-nums">
      <span className={cn("font-medium", estado === "agotado" ? "text-danger" : estado === "bajo" ? "text-warning-text" : "text-ink")}>
        {stock}
      </span>
      {estado !== "ok" && (
        <span className={cn("ml-1.5 text-xs", estado === "agotado" ? "text-danger" : "text-warning-text")}>
          {estado === "agotado" ? "agotado" : "bajo mínimo"}
        </span>
      )}
    </span>
  );
}

export function TablaVariantes({ productId, producto, variantes, esAdmin }: TablaVariantesProps) {
  // Un solo modal a la vez (SPEC.md §5.3). Qué modal y sobre qué variante se
  // guarda aparte de si está abierto: al cerrar, el modal sigue montado
  // mientras se anima y devuelve el foco al botón que lo abrió (§5.3).
  const [modal, setModal] = useState<{ tipo: "mover" | "editar" | "crear"; variante?: VarianteDelPanel } | null>(null);
  const [abierto, setAbierto] = useState(false);
  const abrir = (tipo: "mover" | "editar" | "crear", variante?: VarianteDelPanel) => {
    setModal({ tipo, variante });
    setAbierto(true);
  };

  return (
    <div className="flex flex-col gap-3">
      {variantes.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Todavía no tiene variantes. Sin al menos una, no se puede pedir en la tienda.
        </p>
      ) : (
        <div className="overflow-x-auto border-y border-border">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th scope="col" className="py-2 pr-3 font-medium">Variante</th>
                <th scope="col" className="py-2 pr-3 font-medium">Stock</th>
                <th scope="col" className="py-2 pr-3 font-medium">Mínimo</th>
                <th scope="col" className="py-2 pr-3 font-medium">Precio</th>
                {esAdmin && <th scope="col" className="py-2 pr-3 font-medium">Costo</th>}
                <th scope="col" className="py-2 font-medium"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {variantes.map((v) => (
                <tr key={v.id} className={cn("border-t border-border", !v.activo && "text-ink-subtle")}>
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    <span className={v.activo ? "text-ink" : ""}>{nombreDeVariante(v)}</span>
                    {!v.activo && <span className="ml-1.5 text-xs">· oculta</span>}
                    {v.sku && <span className="block text-xs text-ink-subtle">{v.sku}</span>}
                  </th>
                  <td className="py-2 pr-3"><EstadoStock stock={v.stock} minimo={v.stockMinimo} /></td>
                  <td className="py-2 pr-3 tabular-nums text-ink-muted">{v.stockMinimo}</td>
                  <td className="py-2 pr-3 tabular-nums">{pesos.format(v.precioVenta)}</td>
                  {esAdmin && (
                    <td className="py-2 pr-3 tabular-nums text-ink-muted">{v.costoUnitario === null ? "—" : pesos.format(v.costoUnitario)}</td>
                  )}
                  <td className="py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => abrir("mover", v)}
                        className="rounded px-2 py-1 text-xs font-medium text-accent hover:bg-accent-soft"
                      >
                        Movimiento<span className="sr-only"> de {nombreDeVariante(v)}</span>
                      </button>
                      {esAdmin && (
                        <button
                          type="button"
                          onClick={() => abrir("editar", v)}
                          className="rounded px-2 py-1 text-xs text-ink-muted hover:bg-canvas-sunken hover:text-ink"
                        >
                          Editar<span className="sr-only"> {nombreDeVariante(v)}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {esAdmin && (
        <div>
          <button
            type="button"
            onClick={() => abrir("crear")}
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-ink hover:bg-canvas-sunken"
          >
            Añadir variante
          </button>
        </div>
      )}

      {modal?.tipo === "mover" && modal.variante && (
        <RegistrarMovimiento
          key={modal.variante.id}
          open={abierto}
          onOpenChange={setAbierto}
          titulo={`${producto} · ${nombreDeVariante(modal.variante)}`}
          stockActual={modal.variante.stock}
          endpoint={`/api/productos/${productId}/variantes/${modal.variante.id}/movimientos`}
        />
      )}
      {(modal?.tipo === "editar" || modal?.tipo === "crear") && (
        <FormularioVariante
          key={modal.variante?.id ?? "nueva"}
          open={abierto}
          onOpenChange={setAbierto}
          productId={productId}
          variante={modal.variante}
        />
      )}
    </div>
  );
}
