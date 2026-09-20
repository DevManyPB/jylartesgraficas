import { miniaturaDesdeUrl } from "@jyl/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductoEstructurado } from "@/components/seo/DatosEstructurados";
import { GaleriaProducto } from "@/components/tienda/GaleriaProducto";
import { PedirProducto } from "@/components/tienda/PedirProducto";
import { productoPublico } from "@/datos/cache";

export const runtime = "nodejs";

export async function generateMetadata({ params }: PageProps<"/tienda/[slug]">): Promise<Metadata> {
  const producto = await productoPublico((await params).slug);
  if (!producto) return { title: "Producto" };

  const portada = producto.imagenes[0];
  return {
    title: producto.nombre,
    description: producto.descripcion || `${producto.nombre}, en la tienda de JYL Artes Gráficos.`,
    openGraph: portada ? { images: [{ url: miniaturaDesdeUrl(portada.url, 1200) ?? portada.url }] } : undefined,
  };
}

/** Ficha de producto — SPEC.md §4.4. */
export default async function Producto({ params }: PageProps<"/tienda/[slug]">) {
  const producto = await productoPublico((await params).slug);
  if (!producto) notFound();

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <ProductoEstructurado producto={producto} />
      <Link href="/tienda" className="text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline">
        ← Tienda
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <GaleriaProducto imagenes={producto.imagenes} nombre={producto.nombre} />

        <div>
          <p className="text-sm text-ink-muted">{producto.categoria}</p>
          <h1 className="mt-1 font-display text-3xl text-ink sm:text-4xl">{producto.nombre}</h1>
          {producto.descripcion && (
            <p className="mt-4 max-w-prose whitespace-pre-line text-base leading-relaxed text-ink-muted">
              {producto.descripcion}
            </p>
          )}

          <PedirProducto producto={producto} />

          <p className="mt-6 text-xs text-ink-subtle">
            El pedido es una solicitud: confirmamos disponibilidad y te escribimos para acordar el pago y la entrega.
          </p>
        </div>
      </div>
    </main>
  );
}
