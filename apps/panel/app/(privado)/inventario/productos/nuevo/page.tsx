import { categoriasDeProductos } from "@jyl/core/server";
import type { Metadata } from "next";
import { Volver } from "@/components/navegacion/Volver";
import { FormularioProducto } from "@/components/inventario/FormularioProducto";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo producto — Panel JYL" };

export default async function NuevoProducto() {
  await paginaSoloPara(["admin"]);
  const categorias = await categoriasDeProductos();

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Volver href="/inventario">
        Inventario
      </Volver>
      <h1 className="mt-1 font-display text-2xl text-ink">Nuevo producto</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        Primero el producto; al guardarlo podrás añadir sus variantes de talla y color, con su stock.
      </p>
      <div className="mt-8 max-w-4xl">
        <FormularioProducto
          categorias={categorias}
          inicial={{
            nombre: "",
            categoria: "",
            descripcion: "",
            proveedor: "",
            permitePersonalizacion: false,
            activo: false,
            imagenes: [],
          }}
        />
      </div>
    </main>
  );
}
