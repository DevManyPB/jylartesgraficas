import Link from "next/link";
import { configuracionPublica } from "@/datos/cache";
import { enlaceWhatsapp } from "@/lib/formato";

/**
 * Pie de página — SPEC.md §4.2: el header solo lleva cuatro destinos y el
 * resto de enlaces vive aquí. Los datos de contacto salen de Configuración,
 * así que el estudio los cambia desde el panel sin tocar código.
 */
export async function SiteFooter() {
  const configuracion = await configuracionPublica();
  const whatsapp = enlaceWhatsapp(configuracion.whatsapp);
  const direccion = [configuracion.direccion.linea, configuracion.direccion.barrio, configuracion.direccion.ciudad]
    .filter(Boolean)
    .join(", ");
  const redes = Object.entries(configuracion.redes).filter(([, url]) => url);

  return (
    <footer className="border-t border-border bg-canvas-sunken">
      <div className="mx-auto grid w-full max-w-content gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <p className="font-display text-lg text-ink">JYL Artes Gráficos</p>
          <p className="mt-2 text-sm text-ink-muted">
            Artes gráficas, desarrollo web y servicios técnicos.
          </p>
        </div>

        <nav aria-labelledby="pie-sitio">
          <h2 id="pie-sitio" className="text-sm font-medium text-ink">
            El sitio
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {[
              { href: "/portafolio", label: "Portafolio" },
              { href: "/nosotros", label: "Nosotros" },
              { href: "/servicios", label: "Servicios" },
              { href: "/tienda", label: "Tienda" },
              { href: "/pedido", label: "Pedir un trabajo" },
              { href: "/mi-cuenta", label: "Mi cuenta" },
            ].map((enlace) => (
              <li key={enlace.href}>
                <Link href={enlace.href} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                  {enlace.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-medium text-ink">Contacto</h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-ink-muted">
            {whatsapp && (
              <li>
                <a href={whatsapp} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-ink hover:underline">
                  WhatsApp
                </a>
              </li>
            )}
            {configuracion.telefono && (
              <li>
                <a
                  href={`tel:${configuracion.telefono.replace(/\s/g, "")}`}
                  className="tabular-nums underline-offset-4 hover:text-ink hover:underline"
                >
                  {configuracion.telefono}
                </a>
              </li>
            )}
            {configuracion.email && (
              <li>
                <a href={`mailto:${configuracion.email}`} className="break-all underline-offset-4 hover:text-ink hover:underline">
                  {configuracion.email}
                </a>
              </li>
            )}
            {direccion && <li>{direccion}</li>}
            <li>
              <Link href="/contacto" className="underline-offset-4 hover:text-ink hover:underline">
                Horarios y mapa
              </Link>
            </li>
          </ul>
        </div>

        <div>
          {redes.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-ink">Redes</h2>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {redes.map(([red, url]) => (
                  <li key={red}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="capitalize text-ink-muted underline-offset-4 hover:text-ink hover:underline"
                    >
                      {red}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-ink-subtle lg:px-8">
          <p>© {new Date().getFullYear()} JYL Artes Gráficos</p>
          <ul className="flex gap-4">
            <li>
              <Link href="/terminos" className="underline-offset-4 hover:text-ink hover:underline">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/privacidad" className="underline-offset-4 hover:text-ink hover:underline">
                Privacidad
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
