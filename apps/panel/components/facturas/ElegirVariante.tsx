"use client";

import { normalizarTexto, type VarianteParaVender } from "@jyl/core";
import { Modal } from "@jyl/ui";
import { useId, useState } from "react";
import { claseEntrada } from "@/components/formularios/Campo";
import { pesos } from "@/components/pedidos/formato";

interface ElegirVarianteProps {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  variantes: VarianteParaVender[];
  onElegir: (variante: VarianteParaVender) => void;
}

/**
 * Elegir del inventario una variante para la factura. La línea queda
 * vinculada: al emitir, descuenta el stock (SPEC.md §6.4). Una variante sin
 * stock se ve pero no se elige: la emisión la rechazaría igual.
 */
export function ElegirVariante({ open, onOpenChange, variantes, onElegir }: ElegirVarianteProps) {
  const id = useId();
  const [busqueda, setBusqueda] = useState("");
  // Cada palabra por separado: "negra m" encuentra "Camiseta — Negra / M".
  const terminos = normalizarTexto(busqueda).split(/\s+/).filter(Boolean);
  const visibles = terminos.length
    ? variantes.filter((v) => {
        const texto = normalizarTexto(`${v.nombre} ${v.sku}`);
        return terminos.every((t) => texto.includes(t));
      })
    : variantes;

  function cerrar(abrir: boolean) {
    if (!abrir) setBusqueda("");
    onOpenChange(abrir);
  }

  return (
    <Modal open={open} onOpenChange={cerrar} size="lg">
      <div className="flex max-h-[80vh] flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Modal.Title className="font-display text-xl leading-tight text-ink">Agregar del inventario</Modal.Title>
            <Modal.Description className="mt-1 text-sm text-ink-muted">
              Al emitir la factura se descuentan del stock las unidades de esta línea.
            </Modal.Description>
          </div>
          <Modal.Close aria-label="Cerrar" className="shrink-0 text-ink-subtle hover:text-ink">
            ✕
          </Modal.Close>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-buscar`} className="text-[13px] font-medium text-ink">
            Buscar por nombre, color, talla o SKU
          </label>
          <input
            id={`${id}-buscar`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoComplete="off"
            inputMode="search"
            aria-controls={`${id}-lista`}
            className={claseEntrada}
          />
        </div>

        <p aria-live="polite" className="sr-only">
          {visibles.length === 1 ? "1 resultado" : `${visibles.length} resultados`}
        </p>

        <ul id={`${id}-lista`} className="-mx-2 min-h-0 flex-1 overflow-y-auto">
          {visibles.map((v) => {
            const agotada = v.stock <= 0;
            return (
              <li key={`${v.productId}/${v.variantId}`}>
                <button
                  type="button"
                  disabled={agotada}
                  onClick={() => {
                    onElegir(v);
                    cerrar(false);
                  }}
                  className="flex w-full items-baseline justify-between gap-4 rounded-md px-2 py-2 text-left text-sm hover:bg-canvas-sunken focus-visible:bg-canvas-sunken disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-ink">{v.nombre}</span>
                    <span className="text-xs text-ink-subtle">
                      {v.sku && <>SKU {v.sku} · </>}
                      {agotada ? "Agotada" : `Quedan ${v.stock}`}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-muted">{pesos.format(v.precioVenta)}</span>
                </button>
              </li>
            );
          })}
          {visibles.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-ink-muted">
              {variantes.length === 0 ? "El inventario todavía no tiene variantes activas." : "Nada coincide con esa búsqueda."}
            </li>
          )}
        </ul>
      </div>
    </Modal>
  );
}
