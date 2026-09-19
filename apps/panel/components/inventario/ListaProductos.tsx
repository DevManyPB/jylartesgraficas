"use client";

import { miniaturaDesdeUrl, type ProductoDelPanel } from "@jyl/core";
import { cn, useToast } from "@jyl/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/components/formularios/enviar";
import { pesos } from "@/components/pedidos/formato";

function rango(p: ProductoDelPanel): string {
  if (p.precioDesde === null) return "Sin precio";
  if (p.precioDesde === p.precioHasta) return pesos.format(p.precioDesde);
  return `${pesos.format(p.precioDesde)} – ${pesos.format(p.precioHasta ?? p.precioDesde)}`;
}

/**
 * Productos en el orden de la tienda. "Subir" y "Bajar" intercambian con el
 * vecino en el servidor, aunque esté en otra página; con teclado funcionan
 * igual que con el ratón.
 */
export function ListaProductos({ productos, esAdmin }: { productos: ProductoDelPanel[]; esAdmin: boolean }) {
  const { toast } = useToast();
  const router = useRouter();
  const [moviendo, setMoviendo] = useState<string | null>(null);

  async function mover(id: string, direccion: -1 | 1) {
    if (moviendo) return;
    setMoviendo(id);
    const r = await enviarJson(`/api/productos/${id}/mover`, "PUT", { direccion });
    setMoviendo(null);
    if (!r.ok) toast({ title: "No cambió el orden", description: r.error, variant: "error" });
    router.refresh();
  }

  return (
    <ul aria-busy={moviendo !== null} className="divide-y divide-border border-y border-border">
      {productos.map((p) => {
        const portada = p.imagenes[0];
        return (
          <li key={p.id} className="flex items-center gap-3 py-2">
            <span className="h-12 w-12 shrink-0 overflow-hidden rounded bg-canvas-sunken">
              {portada && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={miniaturaDesdeUrl(portada.url, 96) ?? portada.url} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/inventario/productos/${p.id}`} className="text-sm font-medium text-ink underline-offset-2 hover:underline">
                {p.nombre}
              </Link>
              <p className="text-xs text-ink-muted">
                {p.categoria} · {rango(p)}
                {!p.activo && <span className="text-ink-subtle"> · no publicado</span>}
              </p>
            </div>
            <div className="text-right text-sm tabular-nums">
              <span className={cn(p.stockTotal === 0 ? "text-danger" : "text-ink")}>{p.stockTotal} en stock</span>
              {p.variantesBajoMinimo > 0 && (
                <span className="block text-xs text-warning">
                  {p.variantesBajoMinimo === 1 ? "1 variante" : `${p.variantesBajoMinimo} variantes`} bajo mínimo
                </span>
              )}
            </div>
            {esAdmin && (
              <div className="flex flex-col text-xs">
                <button type="button" onClick={() => mover(p.id, -1)} aria-label={`Subir ${p.nombre}`} className="rounded px-2 py-0.5 text-ink-muted hover:bg-canvas-sunken hover:text-ink">
                  Subir
                </button>
                <button type="button" onClick={() => mover(p.id, 1)} aria-label={`Bajar ${p.nombre}`} className="rounded px-2 py-0.5 text-ink-muted hover:bg-canvas-sunken hover:text-ink">
                  Bajar
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
