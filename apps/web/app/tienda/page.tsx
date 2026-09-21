import { miniaturaDesdeUrl, rangoDePrecio } from "@jyl/core";
import { cn } from "@jyl/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { Filtros } from "@/components/filtros/Filtros";
import { IconoCajaVacia } from "@/components/iconos/Iconos";
import { Vacio } from "@/components/vacio/Vacio";
import { productosPublicos } from "@/datos/cache";
import { pesos } from "@/lib/formato";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Productos del estudio, con opción de personalizarlos con tu diseño.",
};

/**
 * Tienda — SPEC.md §4.4: filtros por categoría y por disponibilidad. Lo
 * agotado se muestra, no se esconde (§6.4); el filtro de disponibilidad es
 * una elección del visitante, no una decisión de la tienda.
 */
export default async function Tienda({ searchParams }: PageProps<"/tienda">) {
  const productos = await productosPublicos();
  const parametros = await searchParams;
  const pedida = parametros.categoria;
  const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const categoria = typeof pedida === "string" && categorias.includes(pedida) ? pedida : null;
  const soloDisponibles = parametros.disponibles === "1";

  const visibles = productos.filter(
    (p) => (!categoria || p.categoria === categoria) && (!soloDisponibles || p.stockTotal > 0),
  );

  /** Conserva el otro filtro al cambiar uno: se combinan, no se pisan. */
  const enlace = (conCategoria: string | null, conDisponibles: boolean) => {
    const query = new URLSearchParams();
    if (conCategoria) query.set("categoria", conCategoria);
    if (conDisponibles) query.set("disponibles", "1");
    const texto = query.toString();
    return texto ? `/tienda?${texto}` : "/tienda";
  };

  const hayAgotados = productos.some((p) => p.stockTotal <= 0);

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Tienda</h1>
      <p className="mt-4 max-w-prose text-base text-ink-muted">
        Pides, lo confirmamos y acordamos el pago. No se paga en línea.
      </p>

      {categorias.length > 1 && (
        <Filtros
          etiqueta="Filtrar por categoría"
          filtros={[
            { href: enlace(null, soloDisponibles), nombre: "Todo", activo: categoria === null },
            ...categorias.map((c) => ({
              href: enlace(c, soloDisponibles),
              nombre: c,
              activo: c === categoria,
            })),
          ]}
        />
      )}

      {hayAgotados && (
        <Filtros
          etiqueta="Filtrar por disponibilidad"
          seguido={categorias.length > 1}
          filtros={[
            { href: enlace(categoria, false), nombre: "Todos los productos", activo: !soloDisponibles },
            { href: enlace(categoria, true), nombre: "Solo disponibles", activo: soloDisponibles },
          ]}
        />
      )}

      {visibles.length > 0 ? (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((producto) => {
            const portada = producto.imagenes[0];
            const agotado = producto.stockTotal <= 0;
            const precio = rangoDePrecio(producto.precioDesde, producto.precioHasta, pesos.format);

            return (
              <li key={producto.slug}>
                <Link
                  href={`/tienda/${producto.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="relative block aspect-square overflow-hidden bg-canvas-sunken">
                    {portada ? (
                      // El mismo `name` que la foto grande de la ficha: al
                      // entrar, esta miniatura se transforma en aquella.
                      <ViewTransition name={`producto-${producto.slug}`} share="pieza" default="none">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={miniaturaDesdeUrl(portada.url, 600) ?? portada.url}
                          alt={portada.alt}
                          loading="lazy"
                          className={cn(
                            "h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]",
                            agotado && "opacity-60",
                          )}
                        />
                      </ViewTransition>
                    ) : (
                      <span className="flex h-full items-center justify-center text-sm text-ink-subtle">Sin foto</span>
                    )}
                    {agotado && (
                      <span className="absolute left-3 top-3 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink">
                        Agotado
                      </span>
                    )}
                  </span>

                  <span className="flex flex-1 flex-col p-4">
                    <span className="font-display text-lg text-ink">{producto.nombre}</span>
                    <span className="mt-0.5 text-sm text-ink-muted">{producto.categoria}</span>
                    <span className="mt-3 flex flex-wrap items-baseline gap-2">
                      {precio ? (
                        <span className="text-base tabular-nums text-ink">{precio}</span>
                      ) : (
                        <span className="text-sm text-ink-muted">Precio a consultar</span>
                      )}
                      {producto.permitePersonalizacion && (
                        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                          Personalizable
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <Vacio
          icono={<IconoCajaVacia className="h-6 w-6" />}
          titulo={productos.length === 0 ? "La tienda está en camino" : "Nada por aquí"}
          accion={
            productos.length === 0 ? (
              <BotonAccion href="/pedido">Pedir un trabajo</BotonAccion>
            ) : soloDisponibles ? (
              <BotonAccion href={enlace(categoria, false)} variante="contorno">
                Ver también lo agotado
              </BotonAccion>
            ) : (
              <BotonAccion href="/tienda" variante="contorno">
                Ver toda la tienda
              </BotonAccion>
            )
          }
        >
          {productos.length === 0
            ? "Mientras tanto, pídenos lo que necesites y lo cotizamos."
            : soloDisponibles
              ? "No hay stock aquí ahora mismo, pero casi todo se puede encargar."
              : "En esta categoría todavía no hay nada publicado."}
        </Vacio>
      )}
    </main>
  );
}
