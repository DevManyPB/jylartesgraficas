import { CATEGORIAS_SERVICIO, NOMBRE_CATEGORIA } from "@jyl/core";
import { Vacio } from "@jyl/ui";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { IconoCodigo, IconoLlave, IconoPincel } from "@/components/iconos/Iconos";
import { FilaServicio } from "@/components/servicios/FilaServicio";
import { configuracionPublica, serviciosPublicos } from "@/datos/cache";
import { enlaceWhatsapp } from "@/lib/formato";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Publicidad y diseño gráfico, desarrollo web y servicios técnicos.",
};

const ICONO_CATEGORIA: Record<(typeof CATEGORIAS_SERVICIO)[number], ReactNode> = {
  publicidad: <IconoPincel className="h-5 w-5" />,
  web: <IconoCodigo className="h-5 w-5" />,
  tecnico: <IconoLlave className="h-5 w-5" />,
};

/**
 * Servicios — SPEC.md §3.1 y §4.3.
 *
 * Un índice, no un catálogo de fichas: el estudio publica los servicios solo
 * con su nombre, así que el nombre es lo que se enseña, grande, y cada línea
 * lleva directamente a pedirlo con ese servicio ya elegido. Si algún día hay
 * descripciones, entran bajo el nombre sin rehacer nada.
 */
export default async function Servicios() {
  const [servicios, configuracion] = await Promise.all([serviciosPublicos(), configuracionPublica()]);
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp, "Hola, quiero preguntar por un servicio.");

  // Solo las áreas que tienen algo publicado.
  const areas = CATEGORIAS_SERVICIO.map((categoria) => ({
    categoria,
    deLaCategoria: servicios.filter((s) => s.categoria === categoria),
  })).filter((area) => area.deLaCategoria.length > 0);

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="registro font-display text-4xl text-ink sm:text-5xl">Lo que hacemos</h1>
      <p className="mt-4 max-w-prose text-base text-ink-muted">
        Toca lo que necesites y te respondemos con una cotización. Si no lo ves en la lista, escríbenos: casi siempre
        se puede.
      </p>

      {servicios.length > 0 ? (
        <div className="mt-14">
          {areas.map(({ categoria, deLaCategoria }) => (
            <section key={categoria} aria-labelledby={`categoria-${categoria}`} className="mt-16 first:mt-0">
              {/* Tono de frase y sin interletraje (AGENTS.md §8). El área es
                  secundaria: lo que manda son los nombres de debajo, así que
                  va pequeña y en gris, no en mayúsculas gritando. */}
              <h2
                id={`categoria-${categoria}`}
                className="flex items-center gap-3 border-b border-border-strong pb-4 font-display text-base text-ink-muted"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
                  {ICONO_CATEGORIA[categoria]}
                </span>
                {NOMBRE_CATEGORIA[categoria]}
              </h2>

              <ul>
                {deLaCategoria.map((servicio) => (
                  <li key={servicio.id}>
                    <FilaServicio id={servicio.id} nombre={servicio.nombre} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <Vacio
          icono={<IconoPincel className="h-6 w-6" />}
          titulo="Estamos actualizando la lista"
          accion={<BotonAccion href="/pedido">Pedir un trabajo</BotonAccion>}
        >
          Escríbenos y te contamos qué podemos hacer.
        </Vacio>
      )}

      <section className="mt-20 rounded-2xl bg-canvas-sunken p-8 sm:p-10">
        <h2 className="font-display text-2xl text-ink">¿Lo tuyo es a medida?</h2>
        <p className="mt-2 max-w-prose text-sm text-ink-muted">
          Escríbenos con la idea, las medidas o una referencia y te decimos qué se puede hacer y cuánto cuesta.
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
