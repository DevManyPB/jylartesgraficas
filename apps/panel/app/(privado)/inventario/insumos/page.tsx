import { estadoDeStock } from "@jyl/core";
import { listarInsumos } from "@jyl/core/server";
import { cn, Vacio } from "@jyl/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { IconoInventario } from "@/components/iconos/Iconos";
import { BotonNuevoInsumo } from "@/components/inventario/InsumoEnModal";
import { PestanasInventario } from "@/components/inventario/PestanasInventario";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Insumos — Panel JYL" };

/** Insumos sin venta directa (tinta, papel, vinilo) — SPEC.md §6.4. */
export default async function Insumos({ searchParams }: PageProps<"/inventario/insumos">) {
  const sesion = await paginaSoloPara(["admin", "operador"]);
  const desde = (await searchParams).desde;
  const pagina = await listarInsumos(typeof desde === "string" ? desde : undefined);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Inventario</h1>
        {/* Con la lista vacía, la acción la lleva la pantalla vacía: dos
            botones que hacen lo mismo en la misma pantalla solo confunden. */}
        {sesion.rol === "admin" && pagina.filas.length > 0 && <BotonNuevoInsumo />}
      </div>
      <PestanasInventario actual="insumos" />

      <div className="mt-4 max-w-3xl">
        {pagina.filas.length === 0 ? (
          <Vacio
            compacto
            icono={<IconoInventario className="h-6 w-6" />}
            titulo="Todavía no hay insumos"
            accion={sesion.rol === "admin" && <BotonNuevoInsumo etiqueta="Agregar el primer insumo" />}
          >
            Lo que el estudio gasta y no vende, como tinta, papel o vinilo: así se sabe cuándo reponer.
          </Vacio>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {pagina.filas.map((i) => {
              const estado = estadoDeStock(i.stock, i.stockMinimo);
              return (
                <li key={i.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Link href={`/inventario/insumos/${i.id}`} className="text-sm font-medium text-ink underline-offset-2 hover:underline">
                      {i.nombre}
                    </Link>
                    {i.proveedor && <p className="text-xs text-ink-muted">{i.proveedor}</p>}
                  </div>
                  <span className="text-right text-sm tabular-nums">
                    <span className={cn(estado === "agotado" ? "text-danger" : estado === "bajo" ? "text-warning-text" : "text-ink")}>
                      {i.stock} {i.unidad}
                    </span>
                    {estado !== "ok" && (
                      <span className={cn("block text-xs", estado === "agotado" ? "text-danger" : "text-warning-text")}>
                        {estado === "agotado" ? "agotado" : "bajo mínimo"}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {pagina.siguiente && (
          <Link href={`/inventario/insumos?desde=${pagina.siguiente}`} className="mt-4 inline-block text-sm text-accent hover:underline">
            Ver más insumos
          </Link>
        )}
      </div>
    </main>
  );
}
