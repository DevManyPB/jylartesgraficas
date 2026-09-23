import { CATEGORIAS_SERVICIO, NOMBRE_CATEGORIA } from "@jyl/core";
import type { Metadata } from "next";
import Link from "next/link";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { configuracionPublica, serviciosPublicos } from "@/datos/cache";
import { enlaceWhatsapp } from "@/lib/formato";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Quiénes somos y cómo trabajamos: del pedido a la entrega.",
};

/**
 * Nosotros — SPEC.md §4.1: quiénes somos y el proceso de trabajo.
 *
 * El proceso que se cuenta aquí es el que el sistema hace de verdad, paso a
 * paso. La historia del estudio la escribe el estudio: mientras no la haya,
 * ese bloque dice que falta en vez de inventar años de trayectoria.
 */
export default async function Nosotros() {
  const [servicios, configuracion] = await Promise.all([serviciosPublicos(), configuracionPublica()]);
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp, "Hola, quiero preguntar por un trabajo.");

  const pasos = [
    {
      titulo: "Nos cuentas qué necesitas",
      texto:
        "Desde el formulario de pedido, con tus referencias, medidas y la fecha para la que lo necesitas. También por WhatsApp, si prefieres escribir.",
    },
    {
      titulo: "Te cotizamos",
      texto:
        "Revisamos lo que mandaste y te pasamos el precio. Un pedido es una solicitud: no se cobra nada hasta que lo apruebes.",
    },
    {
      titulo: "Producimos",
      texto:
        "Con el trabajo aprobado, empezamos. Puedes seguir el estado de tu pedido con el número que te damos al enviarlo.",
    },
    {
      titulo: "Entregamos y facturamos",
      texto: "Te avisamos cuando esté listo, y la factura sale del mismo pedido, con lo que se acordó.",
    },
  ];

  const categoriasConServicios = CATEGORIAS_SERVICIO.map((cat) => ({
    categoria: cat,
    nombre: NOMBRE_CATEGORIA[cat],
    items: servicios.filter((s) => s.categoria === cat),
  })).filter((c) => c.items.length > 0);

  const principal = categoriasConServicios[0];
  const secundarias = categoriasConServicios.slice(1);

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="registro font-display text-4xl text-ink sm:text-5xl">Nosotros</h1>

      <section aria-labelledby="quienes" className="mt-10 max-w-prose">
        <h2 id="quienes" className="font-display text-2xl text-ink">
          Quiénes somos
        </h2>
        <p className="mt-3 rounded-xl border border-dashed border-border-strong bg-canvas-sunken p-5 text-sm text-ink-muted">
          <span className="font-medium text-ink">Pendiente: </span>
          esta parte la escribe el estudio — desde cuándo trabaja, quiénes están detrás y qué lo distingue. Preferimos
          dejarlo en blanco antes que contar una historia que no es la nuestra.
        </p>
      </section>

      <section aria-labelledby="que-hacemos" className="mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="que-hacemos" className="font-display text-2xl text-ink">
            Qué hacemos
          </h2>
          <Link href="/servicios" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            Ver catálogo completo
          </Link>
        </div>

        {/* Layout asimétrico: columna principal destacada + secundarias apiladas (AGENTS.md §8) */}
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {principal && (
            <div className="flex flex-col justify-between rounded-2xl border border-border-strong bg-canvas-sunken/60 p-6 sm:p-8 lg:col-span-7">
              <div>
                <h3 className="font-display text-2xl text-ink sm:text-3xl">{principal.nombre}</h3>
                {/* TODO: contenido pendiente del cliente — la descripción del
                    área la escribe el estudio (AGENTS.md §10). */}
                <p className="mt-2 text-sm text-ink-muted">
                  <span className="font-medium text-ink">Pendiente: </span>
                  una línea del estudio sobre esta área.
                </p>
                <ul className="mt-6 grid grid-cols-1 gap-2.5 text-sm text-ink sm:grid-cols-2">
                  {principal.items.slice(0, 8).map((servicio) => (
                    <li key={servicio.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span className="truncate">{servicio.nombre}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-8 border-t border-border pt-4">
                <Link href={`/servicios#categoria-${principal.categoria}`} className="text-xs font-medium text-ink-muted hover:text-accent">
                  Explorar todos los servicios de {principal.nombre.toLowerCase()}
                </Link>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-5 lg:col-span-5">
            {secundarias.map((cat) => (
              <div key={cat.categoria} className="flex flex-1 flex-col justify-between rounded-2xl border border-border p-6">
                <div>
                  <h3 className="font-display text-xl text-ink">{cat.nombre}</h3>
                  <ul className="mt-3 flex flex-wrap gap-2 text-xs">
                    {cat.items.slice(0, 6).map((servicio) => (
                      <li key={servicio.id} className="rounded-md bg-canvas-sunken px-2.5 py-1 text-ink-muted">
                        {servicio.nombre}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 border-t border-border pt-3">
                  <Link href={`/servicios#categoria-${cat.categoria}`} className="text-xs font-medium text-ink-muted hover:text-accent">
                    Ver {cat.nombre.toLowerCase()}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="proceso" className="mt-20">
        <h2 id="proceso" className="font-display text-2xl text-ink">
          Cómo trabajamos
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Del primer contacto a la entrega, con seguimiento claro en cada etapa.
        </p>

        {/* Timeline horizontal en escritorio, vertical en móvil — sin números decorativos (AGENTS.md §8) */}
        <div className="mt-10">
          {/* Vista móvil: vertical con línea continua */}
          <ol className="relative space-y-8 border-l border-border pl-6 lg:hidden">
            {pasos.map((paso) => (
              <li key={paso.titulo} className="relative">
                <span
                  className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-accent bg-canvas"
                  aria-hidden
                />
                <h3 className="font-display text-base text-ink">{paso.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{paso.texto}</p>
              </li>
            ))}
          </ol>

          {/* Vista escritorio: horizontal continuo con conectores */}
          <ol className="hidden border-t border-border pt-4 lg:grid lg:grid-cols-4 lg:gap-8">
            {pasos.map((paso) => (
              <li key={paso.titulo} className="relative">
                <span
                  className="absolute -top-[23px] left-0 h-3.5 w-3.5 rounded-full border-2 border-accent bg-canvas"
                  aria-hidden
                />
                <h3 className="font-display text-lg text-ink">{paso.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mt-20 rounded-2xl bg-canvas-sunken p-8 sm:p-10">
        <h2 className="font-display text-2xl text-ink">¿Empezamos?</h2>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Cuéntanos qué necesitas y te respondemos con una cotización.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <BotonAccion href="/pedido">Pedir un trabajo</BotonAccion>
          {whatsapp && (
            <BotonAccion href={whatsapp} variante="contorno" externo>
              Escribir por WhatsApp
            </BotonAccion>
          )}
        </div>
      </section>
    </main>
  );
}
