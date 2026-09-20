import { CATEGORIAS_SERVICIO, NOMBRE_CATEGORIA } from "@jyl/core";
import type { Metadata } from "next";
import Link from "next/link";
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

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Nosotros</h1>

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

      <section aria-labelledby="que-hacemos" className="mt-14">
        <h2 id="que-hacemos" className="font-display text-2xl text-ink">
          Qué hacemos
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {CATEGORIAS_SERVICIO.map((categoria) => {
            const deLaCategoria = servicios.filter((s) => s.categoria === categoria);
            if (deLaCategoria.length === 0) return null;
            return (
              <li key={categoria} className="rounded-xl border border-border p-5">
                <h3 className="font-display text-lg text-ink">{NOMBRE_CATEGORIA[categoria]}</h3>
                <ul className="mt-2 flex flex-col gap-1 text-sm text-ink-muted">
                  {deLaCategoria.slice(0, 6).map((servicio) => (
                    <li key={servicio.id}>{servicio.nombre}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-sm">
          <Link href="/servicios" className="font-medium text-accent underline-offset-4 hover:underline">
            Ver todos los servicios
          </Link>
        </p>
      </section>

      <section aria-labelledby="proceso" className="mt-14">
        <h2 id="proceso" className="font-display text-2xl text-ink">
          Cómo trabajamos
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2">
          {pasos.map((paso, i) => (
            <li key={paso.titulo} className="rounded-xl border border-border p-5">
              <span aria-hidden className="font-display text-sm text-accent">
                {i + 1}
              </span>
              <h3 className="mt-1 font-display text-lg text-ink">{paso.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 rounded-2xl bg-canvas-sunken p-8 sm:p-10">
        <h2 className="font-display text-2xl text-ink">¿Empezamos?</h2>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Cuéntanos qué necesitas y te respondemos con una cotización.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/pedido"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover"
          >
            Pedir un trabajo
          </Link>
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
            >
              Escribir por WhatsApp
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
