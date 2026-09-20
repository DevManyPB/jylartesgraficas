"use client";

import { nombreDeVariantePublica, type ProductoPublicoConVariantes } from "@jyl/core";
import { cn } from "@jyl/ui";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { pesos } from "@/lib/formato";

const MAX_UNIDADES = 500;

/**
 * Elegir variante y cantidad — SPEC.md §4.4. Una variante agotada aparece
 * deshabilitada, no oculta (§6.4): saber que existe pero no hay es
 * información útil, y el cliente puede preguntar por ella.
 *
 * Esto no es un carrito: no hay pago en línea (SPEC.md §1). Al continuar se
 * abre el formulario de pedido con el producto ya elegido.
 */
export function PedirProducto({ producto }: { producto: ProductoPublicoConVariantes }) {
  const router = useRouter();
  const id = useId();
  const disponibles = producto.variantes.filter((v) => v.stock > 0);
  const [variantId, setVariantId] = useState(disponibles[0]?.id ?? producto.variantes[0]?.id ?? "");
  const [cantidad, setCantidad] = useState(1);
  const [personalizado, setPersonalizado] = useState(false);

  const elegida = producto.variantes.find((v) => v.id === variantId);
  const agotada = !elegida || elegida.stock <= 0;
  const cantidadValida = cantidad >= 1 && cantidad <= (elegida?.stock ?? 0);

  function continuar() {
    if (!elegida || !cantidadValida) return;
    const parametros = new URLSearchParams({
      producto: producto.slug,
      variante: elegida.id,
      cantidad: String(cantidad),
    });
    if (personalizado) parametros.set("personalizado", "1");
    router.push(`/pedido?${parametros.toString()}`);
  }

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        continuar();
      }}
      className="mt-8 flex flex-col gap-6"
    >
      {producto.variantes.length === 0 ? (
        <p className="rounded-lg border border-border bg-canvas-sunken p-4 text-sm text-ink-muted">
          Este producto todavía no tiene opciones publicadas. Escríbenos y te contamos.
        </p>
      ) : (
        <fieldset>
          <legend className="text-sm font-medium text-ink">Elige una opción</legend>
          <div className="mt-3 flex flex-col gap-2">
            {producto.variantes.map((v) => {
              const sinStock = v.stock <= 0;
              const nombre = nombreDeVariantePublica(v) || "Única";
              return (
                <label
                  key={v.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                    sinStock && "cursor-not-allowed opacity-60",
                    variantId === v.id && !sinStock ? "border-accent bg-accent-soft" : "border-border",
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-variante`}
                    value={v.id}
                    checked={variantId === v.id}
                    disabled={sinStock}
                    onChange={() => {
                      setVariantId(v.id);
                      setCantidad(1);
                    }}
                    className="accent-accent"
                  />
                  <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm text-ink">
                      {nombre}
                      {sinStock && <span className="ml-2 text-xs text-ink-muted">Agotada</span>}
                      {!sinStock && v.stock <= 3 && (
                        <span className="ml-2 text-xs text-warning">Quedan {v.stock}</span>
                      )}
                    </span>
                    <span className="text-sm tabular-nums text-ink">{pesos.format(v.precioVenta)}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {!agotada && (
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-cantidad`} className="text-sm font-medium text-ink">
              Cantidad
            </label>
            <input
              id={`${id}-cantidad`}
              type="number"
              min={1}
              max={Math.min(elegida.stock, MAX_UNIDADES)}
              value={cantidad}
              onChange={(e) => setCantidad(Math.max(1, Math.min(Number(e.target.value) || 1, MAX_UNIDADES)))}
              aria-describedby={`${id}-stock`}
              className="w-24 rounded-lg border border-border-strong bg-canvas px-3 py-2 text-base text-ink outline-none focus:border-accent"
            />
            <p id={`${id}-stock`} className={cn("text-xs", cantidadValida ? "text-ink-subtle" : "text-danger")}>
              {cantidadValida ? `Hay ${elegida.stock} disponibles.` : `Solo quedan ${elegida.stock}.`}
            </p>
          </div>

          <p className="ml-auto text-right">
            <span className="block text-xs text-ink-muted">Total aproximado</span>
            <span className="font-display text-2xl tabular-nums text-ink">
              {pesos.format(elegida.precioVenta * Math.max(1, cantidad))}
            </span>
          </p>
        </div>
      )}

      {producto.permitePersonalizacion && (
        <label className="flex items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            checked={personalizado}
            onChange={(e) => setPersonalizado(e.target.checked)}
            className="mt-0.5 accent-accent"
          />
          <span className="text-sm text-ink">
            Quiero personalizarlo con mi diseño
            <span className="mt-0.5 block text-xs text-ink-muted">
              En el siguiente paso podrás adjuntar el archivo y contarnos cómo lo quieres.
            </span>
          </span>
        </label>
      )}

      <button
        type="submit"
        disabled={agotada || !cantidadValida}
        className="self-start rounded-full bg-accent px-6 py-3 text-base font-medium text-ink-inverted transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {agotada ? "Agotado por ahora" : "Pedir este producto"}
      </button>
    </form>
  );
}
