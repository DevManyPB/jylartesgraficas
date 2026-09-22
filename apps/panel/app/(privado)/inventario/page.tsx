import { listarProductos } from "@jyl/core/server";
import { Vacio } from "@jyl/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { IconoInventario } from "@/components/iconos/Iconos";
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
        {pagina.filas.length === 0 && desde ? (
          <p className="border-y border-border py-8 text-center text-sm text-ink-muted">No hay más productos.</p>
        ) : pagina.filas.length === 0 ? (
          <Vacio
            compacto
            icono={<IconoInventario className="h-6 w-6" />}
            titulo="Todavía no hay productos"
            accion={
              esAdmin && (
                <Link
                  href="/inventario/productos/nuevo"
                  className="inline-flex rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Agregar el primer producto
                </Link>
              )
            }
          >
            Lo que agregues aquí aparece en la tienda del sitio.
          </Vacio>
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
