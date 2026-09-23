import type { Metadata } from "next";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { Mapa } from "@/components/contacto/Mapa";
import { EstadoAhora } from "@/components/horario/EstadoAhora";
import { TablaHorarios } from "@/components/horario/TablaHorarios";
import { IconoCorreo, IconoReloj, IconoTelefono, IconoUbicacion, IconoWhatsapp } from "@/components/iconos/Iconos";
import { NegocioLocal } from "@/components/seo/DatosEstructurados";
import { configuracionPublica } from "@/datos/cache";
import { enlaceWhatsapp, franjaDelDia, lineaDeDireccion } from "@/lib/formato";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Dónde estamos, a qué hora abrimos y cómo escribirnos.",
};

/** Contacto — SPEC.md §4.6: mapa con Leaflet, WhatsApp y horarios. */
export default async function Contacto() {
  const configuracion = await configuracionPublica();
  const { direccion, horarios } = configuracion;
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp, "Hola, quiero hacer una consulta.");
  const lineaDireccion = lineaDeDireccion(direccion);
  const hayMapa = direccion.lat !== null && direccion.lng !== null;
  const comoLlegar = hayMapa
    ? `https://www.google.com/maps/dir/?api=1&destination=${direccion.lat},${direccion.lng}`
    : lineaDireccion
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lineaDireccion)}`
      : null;

  // Cada forma de contacto es una fila que se pulsa entera: escribir, llamar
  // o mandar un correo, sin tener que copiar el dato.
  const contactos = [
    whatsapp
      ? {
          etiqueta: "WhatsApp",
          valor: "Escríbenos",
          href: whatsapp,
          externo: true,
          icono: <IconoWhatsapp className="h-5 w-5" />,
        }
      : null,
    configuracion.telefono
      ? {
          etiqueta: "Teléfono",
          valor: configuracion.telefono,
          href: `tel:${configuracion.telefono.replace(/\s/g, "")}`,
          externo: false,
          icono: <IconoTelefono className="h-5 w-5" />,
        }
      : null,
    configuracion.email
      ? {
          etiqueta: "Correo",
          valor: configuracion.email,
          href: `mailto:${configuracion.email}`,
          externo: false,
          icono: <IconoCorreo className="h-5 w-5" />,
        }
      : null,
  ].filter((c) => c !== null);

  const redes = Object.entries(configuracion.redes).filter(([, url]) => url);

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <NegocioLocal configuracion={configuracion} />
      <h1 className="registro font-display text-4xl text-ink sm:text-5xl">Contacto</h1>
      <p className="mt-4 max-w-prose text-base text-ink-muted">
        Escríbenos por WhatsApp para lo rápido, o mándanos el pedido con los archivos si ya sabes qué necesitas.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-3">
            {whatsapp && (
              <BotonAccion href={whatsapp} externo>
                Escribir por WhatsApp
              </BotonAccion>
            )}
            <BotonAccion href="/pedido" variante="contorno">
              Pedir un trabajo
            </BotonAccion>
          </div>

          {contactos.length > 0 && (
            <section aria-labelledby="datos">
              <h2 id="datos" className="font-display text-xl text-ink">
                Datos
              </h2>
              <ul className="mt-3 flex flex-col">
                {contactos.map((contacto) => (
                  <li key={contacto.etiqueta}>
                    <a
                      href={contacto.href}
                      {...(contacto.externo ? { target: "_blank", rel: "noreferrer" } : {})}
                      className="group flex items-center gap-4 border-b border-border px-1 py-3 transition-colors hover:bg-canvas-sunken focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-ink transition-colors group-hover:border-accent group-hover:text-accent">
                        {contacto.icono}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-xs text-ink-muted">{contacto.etiqueta}</span>
                        <span className="truncate text-sm font-medium text-ink">{contacto.valor}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lineaDireccion && (
            <section aria-labelledby="donde">
              <h2 id="donde" className="flex items-center gap-2 font-display text-xl text-ink">
                <IconoUbicacion className="h-5 w-5 text-accent" />
                Dónde estamos
              </h2>
              <address className="mt-3 not-italic text-sm text-ink">
                {lineaDireccion}
                {direccion.referencia && <span className="block text-ink-muted">{direccion.referencia}</span>}
              </address>
              {comoLlegar && (
                <div className="mt-4">
                  <BotonAccion href={comoLlegar} variante="contorno" externo>
                    Cómo llegar
                  </BotonAccion>
                </div>
              )}
            </section>
          )}

          <section aria-labelledby="horarios">
            <h2 id="horarios" className="flex items-center gap-2 font-display text-xl text-ink">
              <IconoReloj className="h-5 w-5 text-accent" />
              Horarios
            </h2>
            {horarios.some((h) => franjaDelDia(h) !== null) ? (
              <>
                <div className="mt-3">
                  <EstadoAhora horarios={horarios} />
                </div>
                <div className="mt-3">
                  <TablaHorarios horarios={horarios} />
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">Escríbenos por WhatsApp y te decimos si estamos abiertos.</p>
            )}
          </section>

          {redes.length > 0 && (
            <section aria-labelledby="redes">
              <h2 id="redes" className="font-display text-xl text-ink">
                Redes
              </h2>
              <ul className="mt-3 flex flex-wrap gap-4 text-sm">
                {redes.map(([red, url]) => (
                  <li key={red}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="capitalize text-ink underline-offset-4 hover:underline"
                    >
                      {red}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* En escritorio el mapa acompaña la columna al hacer scroll: la de
            la izquierda es mucho más larga y el mapa se quedaba arriba, con
            un hueco debajo. */}
        {hayMapa ? (
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Mapa
              lat={direccion.lat!}
              lng={direccion.lng!}
              titulo="JYL Artes Gráficos"
              alto="h-80 sm:h-96 lg:h-[calc(100vh-9rem)] lg:max-h-[44rem]"
            />
          </div>
        ) : (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-canvas-sunken p-6 text-center text-sm text-ink-muted sm:h-96">
            Estamos actualizando la ubicación en el mapa. Mientras tanto, escríbenos y te indicamos cómo llegar.
          </div>
        )}
      </div>
    </main>
  );
}
