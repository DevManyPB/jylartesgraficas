import { categoriasDeProductos, leerProducto, movimientosDeProducto } from "@jyl/core/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Volver } from "@/components/navegacion/Volver";
import { FormularioProducto } from "@/components/inventario/FormularioProducto";
import { HistorialMovimientos } from "@/components/inventario/HistorialMovimientos";
import { TablaVariantes } from "@/components/inventario/TablaVariantes";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Producto — Panel JYL" };

/**
 * Un producto con sus variantes y su historial — SPEC.md §6.4. El admin lo
 * edita todo; el operador ve el stock y registra movimientos (§6.1).
 */
export default async function DetalleProducto({ params }: PageProps<"/inventario/productos/[id]">) {
  const sesion = await paginaSoloPara(["admin", "operador"]);
  const esAdmin = sesion.rol === "admin";
  const { id } = await params;

  const leido = await leerProducto(id);
  if (!leido) notFound();
  // El costo es finanzas (SPEC.md §6.1). No basta con no pintarlo: todo lo que
  // se pasa a un componente de cliente viaja al navegador en el payload, se
  // muestre o no. Para el operador se quita aquí, en el servidor.
  const producto = esAdmin
    ? leido
    : { ...leido, variantes: leido.variantes.map((v) => ({ ...v, costoUnitario: null })) };
  const [movimientos, categorias] = await Promise.all([
    movimientosDeProducto(id, producto.variantes),
    esAdmin ? categoriasDeProductos() : Promise.resolve([]),
  ]);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Volver href="/inventario">
        Inventario
      </Volver>
      <h1 className="mt-1 font-display text-2xl text-ink">{producto.nombre}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {producto.categoria} · {producto.stockTotal} en stock
        {!producto.activo && " · no publicado en la tienda"}
      </p>

      <div className="mt-8 flex max-w-4xl flex-col gap-10">
        <section aria-labelledby="titulo-variantes">
          <h2 id="titulo-variantes" className="font-display text-base text-ink">Variantes y stock</h2>
          <div className="mt-3">
            <TablaVariantes productId={producto.id} producto={producto.nombre} variantes={producto.variantes} esAdmin={esAdmin} />
          </div>
        </section>

        <section aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" className="font-display text-base text-ink">Últimos movimientos</h2>
          <div className="mt-3">
            <HistorialMovimientos movimientos={movimientos} />
          </div>
        </section>

        {esAdmin && (
          <section aria-labelledby="titulo-ficha">
            <h2 id="titulo-ficha" className="sr-only">Ficha del producto</h2>
            <FormularioProducto
              key={producto.id}
              id={producto.id}
              categorias={categorias}
              inicial={{
                nombre: producto.nombre,
                categoria: producto.categoria,
                descripcion: producto.descripcion,
                proveedor: producto.proveedor,
                permitePersonalizacion: producto.permitePersonalizacion,
                activo: producto.activo,
                imagenes: producto.imagenes.map(({ publicId, alt, url }) => ({ publicId, alt, url })),
              }}
            />
          </section>
        )}
      </div>
    </main>
  );
}
