import { DIAS_SEMANA, NOMBRE_DIA } from "@jyl/core";
import type { Metadata } from "next";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { Mapa } from "@/components/contacto/Mapa";
import { EstadoAhora } from "@/components/horario/EstadoAhora";
import { IconoCorreo, IconoReloj, IconoTelefono, IconoUbicacion } from "@/components/iconos/Iconos";
import { NegocioLocal } from "@/components/seo/DatosEstructurados";
import { configuracionPublica } from "@/datos/cache";
import { enlaceWhatsapp, franjaDelDia } from "@/lib/formato";

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
  const lineaDireccion = [direccion.linea, direccion.barrio, direccion.ciudad].filter(Boolean).join(", ");
  const hayMapa = direccion.lat !== null && direccion.lng !== null;
  const comoLlegar = hayMapa
    ? `https://www.google.com/maps/dir/?api=1&destination=${direccion.lat},${direccion.lng}`
    : lineaDireccion
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lineaDireccion)}`
      : null;

  const contactos = [
    configuracion.telefono
      ? {
          etiqueta: "Teléfono",
          valor: configuracion.telefono,
          href: `tel:${configuracion.telefono.replace(/\s/g, "")}`,
          icono: <IconoTelefono className="h-4 w-4" />,
        }
      : null,
    configuracion.email
      ? {
          etiqueta: "Correo",
          valor: configuracion.email,
          href: `mailto:${configuracion.email}`,
          icono: <IconoCorreo className="h-4 w-4" />,
        }
      : null,
  ].filter((c) => c !== null);

  const redes = Object.entries(configuracion.redes).filter(([, url]) => url);

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <NegocioLocal configuracion={configuracion} />
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Contacto</h1>
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
              <dl className="mt-3 flex flex-col gap-2 text-sm">
                {contactos.map((contacto) => (
                  <div key={contacto.etiqueta} className="flex items-center gap-3">
                    <dt className="flex w-24 shrink-0 items-center gap-2 text-ink-muted">
                      {contacto.icono}
                      {contacto.etiqueta}
                    </dt>
                    <dd>
                      <a href={contacto.href} className="text-ink underline-offset-4 hover:underline">
                        {contacto.valor}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
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
                <a
                  href={comoLlegar}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  Cómo llegar
                </a>
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
                <dl className="mt-3 flex flex-col gap-1 text-sm">
                {DIAS_SEMANA.map((dia) => {
                  const horario = horarios.find((h) => h.dia === dia);
                  const franja = horario ? franjaDelDia(horario) : null;
                  return (
                    <div key={dia} className="flex justify-between gap-4 border-b border-border py-1 last:border-0">
                      <dt className="text-ink-muted">{NOMBRE_DIA[dia]}</dt>
                      <dd className="tabular-nums text-ink">{franja ?? "—"}</dd>
                    </div>
                  );
                })}
                </dl>
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

        {hayMapa ? (
          <Mapa lat={direccion.lat!} lng={direccion.lng!} titulo="JYL Artes Gráficos" />
        ) : (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-canvas-sunken p-6 text-center text-sm text-ink-muted sm:h-96">
            Estamos actualizando la ubicación en el mapa. Mientras tanto, escríbenos y te indicamos cómo llegar.
          </div>
        )}
      </div>
    </main>
  );
}
