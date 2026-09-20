import { CATEGORIAS_SERVICIO, miniaturaDesdeUrl, NOMBRE_CATEGORIA } from "@jyl/core";
import Link from "next/link";
import { configuracionPublica, productosPublicos, proyectosPublicos, serviciosPublicos } from "@/datos/cache";
import { enlaceWhatsapp, franjaDelDia } from "@/lib/formato";

export const runtime = "nodejs";

const PIEZAS_EN_INICIO = 6;

/**
 * Inicio — SPEC.md §4.3: una pieza del portafolio a pantalla completa,
 * trabajos recientes, servicios y ubicación. Todo sale de lo que el estudio
 * haya publicado desde el panel; lo que no exista todavía no se inventa: esa
 * sección simplemente no aparece.
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
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp, "Hola, quiero preguntar por un trabajo.");
  const direccion = [configuracion.direccion.linea, configuracion.direccion.barrio, configuracion.direccion.ciudad]
    .filter(Boolean)
    .join(", ");
  const hoy = configuracion.horarios.find((h) => franjaDelDia(h) !== null);

  return (
    <main>
      <section data-hero className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-canvas-dark px-6 pb-20 text-ink-inverted lg:px-8">
        {heroe && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={miniaturaDesdeUrl(heroe.url, 1800, "limit") ?? heroe.url}
              alt={heroe.alt}
              className="absolute inset-0 h-full w-full object-cover opacity-55"
            />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas-dark via-canvas-dark/60 to-canvas-dark/20" />
          </>
        )}

        <div className="relative mx-auto w-full max-w-content">
          <h1 className="font-display text-5xl sm:text-display lg:text-display-lg">JYL Artes Gráficos</h1>
          <p className="mt-6 max-w-md text-base text-ink-inverted/70">
            Artes gráficas, desarrollo web y servicios técnicos.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/pedido"
              className="inline-flex rounded-full bg-accent px-6 py-3 text-base font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              Pedir un trabajo
            </Link>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-ink-inverted/30 px-6 py-3 text-base font-medium text-ink-inverted transition-colors hover:bg-ink-inverted/10"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
          {piezas[0] && (
            <p className="mt-8 text-sm text-ink-inverted/60">
              En la foto: {piezas[0].titulo}
              {piezas[0].cliente && ` · ${piezas[0].cliente}`}
            </p>
          )}
        </div>
      </section>

      {piezas.length > 0 && (
        <section aria-labelledby="inicio-portafolio" className="border-b border-border px-6 py-20 lg:px-8">
          <div className="mx-auto w-full max-w-content">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="inicio-portafolio" className="font-display text-3xl text-ink">
                Trabajos recientes
              </h2>
              <Link href="/portafolio" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
                Ver todo el portafolio
              </Link>
            </div>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {piezas.map((pieza) => {
                const portada = pieza.imagenes[0];
                if (!portada) return null;
                return (
                  <li key={pieza.slug}>
                    <Link
                      href={`/portafolio?categoria=${encodeURIComponent(pieza.categoria)}`}
                      className="group block overflow-hidden rounded-xl border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={miniaturaDesdeUrl(portada.url, 700) ?? portada.url}
                        alt={portada.alt}
                        loading="lazy"
                        className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <span className="block p-4">
                        <span className="block font-display text-lg text-ink">{pieza.titulo}</span>
                        <span className="text-sm text-ink-muted">{pieza.categoria}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
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

            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {CATEGORIAS_SERVICIO.map((categoria) => {
                const deLaCategoria = servicios.filter((s) => s.categoria === categoria);
                if (deLaCategoria.length === 0) return null;
                return (
                  <li key={categoria} className="rounded-xl border border-border p-6">
                    <h3 className="font-display text-xl text-ink">{NOMBRE_CATEGORIA[categoria]}</h3>
                    <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink-muted">
                      {deLaCategoria.slice(0, 5).map((servicio) => (
                        <li key={servicio.id}>{servicio.nombre}</li>
                      ))}
                      {deLaCategoria.length > 5 && <li className="text-ink-subtle">y {deLaCategoria.length - 5} más</li>}
                    </ul>
                  </li>
                );
              })}
            </ul>
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
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {productos.slice(0, 4).map((producto) => {
                const portada = producto.imagenes[0];
                return (
                  <li key={producto.slug}>
                    <Link
                      href={`/tienda/${producto.slug}`}
                      className="group block overflow-hidden rounded-xl border border-border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="block aspect-square bg-canvas-sunken">
                        {portada && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={miniaturaDesdeUrl(portada.url, 500) ?? portada.url}
                            alt={portada.alt}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        )}
                      </span>
                      <span className="block p-4 text-sm">
                        <span className="block font-medium text-ink">{producto.nombre}</span>
                        <span className="text-ink-muted">{producto.categoria}</span>
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
        <div className="mx-auto grid w-full max-w-content gap-8 sm:grid-cols-2">
          <div>
            <h2 id="inicio-ubicacion" className="font-display text-3xl text-ink">
              Dónde estamos
            </h2>
            {direccion ? (
              <address className="mt-3 not-italic text-base text-ink-muted">{direccion}</address>
            ) : (
              <p className="mt-3 text-base text-ink-muted">Escríbenos y te decimos cómo llegar.</p>
            )}
            {hoy && <p className="mt-2 text-sm text-ink-subtle">Consulta los horarios de cada día en Contacto.</p>}
            <Link
              href="/contacto"
              className="mt-6 inline-flex rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken"
            >
              Horarios y mapa
            </Link>
          </div>

          <div className="rounded-2xl bg-canvas-sunken p-8">
            <h3 className="font-display text-xl text-ink">¿Tienes una idea?</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Mándanos las referencias y las medidas y te respondemos con una cotización.
            </p>
            <Link
              href="/pedido"
              className="mt-6 inline-flex rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover"
            >
              Pedir un trabajo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
