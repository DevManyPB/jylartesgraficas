import { CATEGORIAS_SERVICIO, NOMBRE_CATEGORIA } from "@jyl/core";
import type { Metadata } from "next";
import Link from "next/link";
import { configuracionPublica, serviciosPublicos } from "@/datos/cache";
import { enlaceWhatsapp } from "@/lib/formato";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Servicios — JYL Artes Gráficos",
  description: "Publicidad y diseño gráfico, desarrollo web y servicios técnicos.",
};

/** Servicios — SPEC.md §3.1 y §4.3. Lo que se muestra es lo que el estudio tenga publicado. */
export default async function Servicios() {
  const [servicios, configuracion] = await Promise.all([serviciosPublicos(), configuracionPublica()]);
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp, "Hola, quiero preguntar por un servicio.");

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Servicios</h1>
      <p className="mt-4 max-w-prose text-base text-ink-muted">
        Cuéntanos qué necesitas y te respondemos con una cotización. Si no ves lo tuyo en la lista, escríbenos: casi
        siempre se puede.
      </p>

      {CATEGORIAS_SERVICIO.map((categoria) => {
        const deLaCategoria = servicios.filter((s) => s.categoria === categoria);
        if (deLaCategoria.length === 0) return null;

        return (
          <section key={categoria} aria-labelledby={`categoria-${categoria}`} className="mt-14">
            <h2 id={`categoria-${categoria}`} className="font-display text-2xl text-ink">
              {NOMBRE_CATEGORIA[categoria]}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {deLaCategoria.map((servicio) => (
                <li
                  key={servicio.id}
                  className="flex flex-col rounded-xl border border-border p-5 transition-colors hover:border-border-strong"
                >
                  <h3 className="font-display text-lg text-ink">{servicio.nombre}</h3>
                  {servicio.descripcion && (
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{servicio.descripcion}</p>
                  )}
                  <Link
                    href={`/pedido?servicio=${servicio.id}`}
                    className="mt-4 self-start text-sm font-medium text-accent underline-offset-4 hover:underline"
                  >
                    Pedir este servicio
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {servicios.length === 0 && (
        <p className="mt-12 rounded-xl border border-border bg-canvas-sunken p-6 text-sm text-ink-muted">
          Estamos actualizando la lista de servicios. Escríbenos y te contamos qué podemos hacer.
        </p>
      )}

      <section className="mt-16 rounded-2xl bg-canvas-sunken p-8 sm:p-10">
        <h2 className="font-display text-2xl text-ink">¿Lo tuyo es a medida?</h2>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Escríbenos con la idea, las medidas o una referencia y te decimos qué se puede hacer y cuánto cuesta.
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
