import { listarProductos } from "@jyl/core/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ListaProductos } from "@/components/inventario/ListaProductos";
import { PestanasInventario } from "@/components/inventario/PestanasInventario";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Inventario — Panel JYL" };

/** Inventario de productos — SPEC.md §6.4. Admin y operador. */
export default async function Inventario({ searchParams }: PageProps<"/inventario">) {
  const sesion = await paginaSoloPara(["admin", "operador"]);
  const desde = (await searchParams).desde;
  const pagina = await listarProductos(typeof desde === "string" ? desde : undefined);
  const esAdmin = sesion.rol === "admin";

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Inventario</h1>
        {esAdmin && (
          <Link
            href="/inventario/productos/nuevo"
            className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover"
          >
            Nuevo producto
          </Link>
        )}
      </div>
      <PestanasInventario actual="productos" />

      <div className="mt-4 max-w-4xl">
        {pagina.filas.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-sm text-ink-muted">
            {desde ? "No hay más productos." : "Todavía no hay productos en el inventario."}
          </p>
        ) : (
          <ListaProductos productos={pagina.filas} esAdmin={esAdmin} />
        )}
        <div className="mt-4 flex gap-4 text-sm">
          {desde && (
            <Link href="/inventario" className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Volver al principio
            </Link>
          )}
          {pagina.siguiente && (
            <Link href={`/inventario?desde=${pagina.siguiente}`} className="text-accent underline-offset-2 hover:underline">
              Ver más productos
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
