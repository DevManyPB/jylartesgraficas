import { CATEGORIAS_SERVICIO, miniaturaDesdeUrl, NOMBRE_CATEGORIA, rangoDePrecio } from "@jyl/core";
import Link from "next/link";
import type { ReactNode } from "react";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { Mapa } from "@/components/contacto/Mapa";
import { EstadoAhora } from "@/components/horario/EstadoAhora";
import { IconoCodigo, IconoLlave, IconoPincel } from "@/components/iconos/Iconos";
import { Pieza } from "@/components/inicio/Pieza";
import { configuracionPublica, productosPublicos, proyectosPublicos, serviciosPublicos } from "@/datos/cache";
import { enlaceWhatsapp, pesos } from "@/lib/formato";

export const runtime = "nodejs";

const PIEZAS_EN_INICIO = 9;

/** Un icono por área de servicio, para que el bloque se recorra con la vista. */
const ICONO_CATEGORIA: Record<(typeof CATEGORIAS_SERVICIO)[number], ReactNode> = {
  publicidad: <IconoPincel className="h-5 w-5" />,
  web: <IconoCodigo className="h-5 w-5" />,
  tecnico: <IconoLlave className="h-5 w-5" />,
};

/**
 * Inicio — SPEC.md §4.3: una pieza del portafolio a pantalla completa,
 * trabajos recientes, servicios, franja de tienda y ubicación. Todo sale de
 * lo que el estudio haya publicado desde el panel; lo que no exista todavía
 * no se inventa: esa sección simplemente no aparece.
 *
 * La rejilla es asimétrica a propósito (§9): la primera pieza manda y el
 * resto la acompaña, cada una con su proporción real. Tres tarjetas iguales
 * en fila dirían de este estudio justo lo contrario de lo que se quiere.
 */
export default async function Home() {
  const [proyectos, servicios, productos, configuracion] = await Promise.all([
    proyectosPublicos(),
    serviciosPublicos(),
    productosPublicos(),
    configuracionPublica(),
  ]);

  const destacados = proyectos.filter((p) => p.destacado);
  const piezas = (destacados.length > 0 ? destacados : proyectos).slice(0, PIEZAS_EN_INICIO);
  const heroe = piezas[0]?.imagenes[0] ?? null;
  // El héroe ya ocupa la primera pantalla: no se repite en la rejilla.
  const [principal, ...acompanan] = piezas.slice(1);
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp, "Hola, quiero preguntar por un trabajo.");
  const { direccion, horarios } = configuracion;
  const lineaDireccion = [direccion.linea, direccion.barrio, direccion.ciudad].filter(Boolean).join(", ");
  const hayMapa = direccion.lat !== null && direccion.lng !== null;
  const hayHorarios = horarios.some((h) => !h.cerrado && h.abre && h.cierra);

  return (
    <main>
      <section
        data-hero
        className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-canvas-dark px-6 pb-20 text-ink-inverted lg:px-8"
      >
        {heroe && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={miniaturaDesdeUrl(heroe.url, 1800, "limit") ?? heroe.url}
              alt={heroe.alt}
              fetchPriority="high"
              className="absolute inset-0 h-full w-full animate-entrada-foto object-cover opacity-55 motion-reduce:animate-none"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-canvas-dark via-canvas-dark/60 to-canvas-dark/20"
            />
          </>
        )}

        <div className="relative mx-auto w-full max-w-content">
          {/* El único momento orquestado del sitio (SPEC.md §9): el texto
              entra escalonado una vez, al cargar. Con prefers-reduced-motion
              aparece ya colocado. */}
          <h1 className="animate-entrada-1 font-display text-5xl motion-reduce:animate-none sm:text-display lg:text-display-lg">
            JYL Artes Gráficos
          </h1>
          <p className="mt-6 max-w-md animate-entrada-2 text-base text-ink-inverted/70 motion-reduce:animate-none">
            Artes gráficas, desarrollo web y servicios técnicos.
          </p>
          <div className="mt-10 flex animate-entrada-3 flex-wrap gap-3 motion-reduce:animate-none">
            <BotonAccion href="/pedido" tamano="grande">
              Pedir un trabajo
            </BotonAccion>
            {whatsapp && (
              <BotonAccion href={whatsapp} variante="claro" tamano="grande" externo>
                Escribir por WhatsApp
              </BotonAccion>
            )}
          </div>
          <div className="mt-8 flex animate-entrada-4 flex-wrap items-center justify-between gap-4 motion-reduce:animate-none">
            {piezas[0] && (
              <p className="text-sm text-ink-inverted/60">
                En la foto: {piezas[0].titulo}
                {piezas[0].cliente && ` · ${piezas[0].cliente}`}
              </p>
            )}
            {piezas.length > 1 && (
              <a
                href="#inicio-portafolio"
                className="group hidden items-center gap-2 text-sm text-ink-inverted/60 transition-colors hover:text-ink-inverted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current sm:inline-flex"
              >
                Ver los trabajos
                <span aria-hidden className="animate-cursor-abajo motion-reduce:animate-none">
                  ↓
                </span>
              </a>
            )}
          </div>
        </div>
      </section>

      {principal && (
        <section aria-labelledby="inicio-portafolio" className="border-b border-border px-6 py-20 lg:px-8">
          <div className="mx-auto w-full max-w-content">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="inicio-portafolio" className="scroll-mt-24 font-display text-3xl text-ink">
                Trabajos recientes
              </h2>
              <Link href="/portafolio" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                Ver todo el portafolio
              </Link>
            </div>

            {/* Una pieza abre la sección a todo el ancho y las demás caen en
                columnas: la rejilla se desordena sola, porque cada foto
                conserva su alto real (SPEC.md §9). */}
            <div className="mt-8">
              <Pieza pieza={principal} ancho={1600} protagonista prioritaria />
            </div>

            {acompanan.length > 0 && (
              <ul className="mt-4 columns-1 gap-4 sm:columns-2 lg:columns-3">
                {acompanan.map((pieza) => (
                  <li key={pieza.slug} className="mb-4 break-inside-avoid">
                    <Pieza pieza={pieza} ancho={700} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {servicios.length > 0 && (
        <section aria-labelledby="inicio-servicios" className="border-b border-border px-6 py-20 lg:px-8">
          <div className="mx-auto w-full max-w-content">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="inicio-servicios" className="font-display text-3xl text-ink">
                Servicios
              </h2>
              <Link href="/servicios" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                Ver todos
              </Link>
            </div>

            {/* Cada área ocupa su franja, con el nombre a un lado y los
                trabajos al otro. Cada trabajo es un enlace: desde aquí se
                pide, sin pasar por una página intermedia. */}
            <dl className="mt-8">
              {CATEGORIAS_SERVICIO.map((categoria) => {
                const deLaCategoria = servicios.filter((s) => s.categoria === categoria);
                if (deLaCategoria.length === 0) return null;
                return (
                  <div
                    key={categoria}
                    className="grid gap-3 border-t border-border py-7 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-8"
                  >
                    <dt className="flex items-center gap-3 font-display text-xl text-ink">
                      {/* El icono no dice nada por sí solo: acompaña al
                          nombre para poder saltar de un vistazo al área que
                          interesa, en vez de leer tres bloques de texto. */}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                        {ICONO_CATEGORIA[categoria]}
                      </span>
                      {NOMBRE_CATEGORIA[categoria]}
                    </dt>
                    <dd>
                      <ul className="flex flex-wrap gap-2">
                        {deLaCategoria.map((servicio) => (
                          <li key={servicio.id}>
                            <Link
                              href={`/pedido?servicio=${servicio.id}`}
                              className="inline-block rounded-full border border-border px-3.5 py-1.5 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            >
                              {servicio.nombre}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </section>
      )}

      {productos.length > 0 && (
        <section aria-labelledby="inicio-tienda" className="border-b border-border px-6 py-20 lg:px-8">
          <div className="mx-auto w-full max-w-content">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="inicio-tienda" className="font-display text-3xl text-ink">
                Tienda
              </h2>
              <Link href="/tienda" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                Ver la tienda
              </Link>
            </div>

            {/* Franja (SPEC.md §4.3): en móvil se arrastra de lado con
                ajuste por producto; desde sm es una rejilla normal. El
                desbordamiento es del contenedor, no de la página. */}
            <ul className="-mx-6 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {productos.slice(0, 8).map((producto) => {
                const portada = producto.imagenes[0];
                const precio = rangoDePrecio(producto.precioDesde, producto.precioHasta, pesos.format);
                return (
                  <li key={producto.slug} className="w-56 shrink-0 snap-start sm:w-auto">
                    <Link
                      href={`/tienda/${producto.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border transition-colors hover:border-border-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="block aspect-square overflow-hidden bg-canvas-sunken">
                        {portada && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={miniaturaDesdeUrl(portada.url, 500) ?? portada.url}
                            alt={portada.alt}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-entrada group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                          />
                        )}
                      </span>
                      <span className="flex flex-1 flex-col p-4 text-sm">
                        <span className="font-medium text-ink transition-colors group-hover:text-accent">
                          {producto.nombre}
                        </span>
                        <span className="text-ink-muted">{producto.categoria}</span>
                        {precio && <span className="mt-2 tabular-nums text-ink">{precio}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <section aria-labelledby="inicio-ubicacion" className="px-6 py-20 lg:px-8">
        <div className="mx-auto grid w-full max-w-content gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <div className="flex flex-col gap-6">
            <div>
              <h2 id="inicio-ubicacion" className="font-display text-3xl text-ink">
                Dónde estamos
              </h2>
              {lineaDireccion ? (
                <address className="mt-3 not-italic text-base text-ink-muted">
                  {lineaDireccion}
                  {direccion.referencia && <span className="block text-ink-subtle">{direccion.referencia}</span>}
                </address>
              ) : (
                <p className="mt-3 text-base text-ink-muted">Escríbenos y te decimos cómo llegar.</p>
              )}
              {hayHorarios && (
                <div className="mt-3">
                  <EstadoAhora horarios={horarios} />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <BotonAccion href="/contacto" variante="contorno">
                Horarios y mapa
              </BotonAccion>
              {whatsapp && (
                <BotonAccion href={whatsapp} variante="contorno" externo>
                  Escribir por WhatsApp
                </BotonAccion>
              )}
            </div>

            <div className="rounded-2xl bg-canvas-sunken p-8">
              <h3 className="font-display text-xl text-ink">¿Tienes una idea?</h3>
              <p className="mt-2 text-sm text-ink-muted">
                Mándanos las referencias y las medidas y te respondemos con una cotización.
              </p>
              <div className="mt-6">
                <BotonAccion href="/pedido">Pedir un trabajo</BotonAccion>
              </div>
            </div>
          </div>

          {hayMapa ? (
            <Mapa lat={direccion.lat!} lng={direccion.lng!} titulo="JYL Artes Gráficos" alto="h-80 lg:h-full lg:min-h-80" />
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-xl border border-dashed border-border bg-canvas-sunken p-6 text-center text-sm text-ink-muted">
              Estamos actualizando la ubicación en el mapa. Escríbenos y te indicamos cómo llegar.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
