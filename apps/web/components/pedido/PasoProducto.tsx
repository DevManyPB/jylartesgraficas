"use client";

import { miniaturaDesdeUrl, nombreDeVariantePublica, type ItemPedido } from "@jyl/core";
import Link from "next/link";
import { pesos } from "@/lib/formato";

export interface ProductoElegido {
  item: ItemPedido;
  /** Portada del producto, para reconocerlo de un vistazo. */
  imagen: { url: string; alt: string } | null;
  precioUnitario: number;
  slug: string;
}

/**
 * Paso 1 cuando se llega desde la tienda: en vez de elegir servicio, se
 * confirma lo que ya se eligió allí. Se puede cambiar volviendo a la ficha,
 * que es donde está el stock de cada variante.
 */
export function PasoProducto({ producto }: { producto: ProductoElegido }) {
  const { item } = producto;
  const variante = nombreDeVariantePublica({ talla: item.talla ?? "", color: item.color ?? "" });

  return (
    <section aria-labelledby="paso-producto">
      <h2 id="paso-producto" className="font-display text-2xl text-ink">
        Tu pedido
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        Esto es lo que vas a pedir. En el siguiente paso puedes contarnos cualquier detalle.
      </p>

      <div className="mt-6 flex gap-4 rounded-xl border border-border p-4">
        {producto.imagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={miniaturaDesdeUrl(producto.imagen.url, 200) ?? producto.imagen.url}
            alt={producto.imagen.alt}
            className="h-24 w-24 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg text-ink">{item.nombre}</p>
          {variante && <p className="text-sm text-ink-muted">{variante}</p>}
          <p className="mt-1 text-sm text-ink-muted">
            {item.cantidad} {item.cantidad === 1 ? "unidad" : "unidades"} ·{" "}
            <span className="tabular-nums">{pesos.format(producto.precioUnitario * item.cantidad)}</span> aprox.
          </p>
          {item.personalizado && (
            <p className="mt-1 text-sm text-accent">Con tu diseño: adjúntalo en el paso de referencias.</p>
          )}
          <Link
            href={`/tienda/${producto.slug}`}
            className="mt-2 inline-block text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Cambiar opción o cantidad
          </Link>
        </div>
      </div>
    </section>
  );
}
