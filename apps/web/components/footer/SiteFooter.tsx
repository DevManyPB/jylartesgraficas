import Link from "next/link";
import { configuracionPublica } from "@/datos/cache";
import { TarjetaDeVisita } from "./TarjetaDeVisita";

/**
 * Pie de página — SPEC.md §4.2: el header solo lleva cuatro destinos y el
 * resto de enlaces vive aquí. Los datos de contacto salen de Configuración,
 * así que el estudio los cambia desde el panel sin tocar código.
 *
 * El contacto va en una tarjeta de visita impresa (`TarjetaDeVisita`); a su
 * lado, los enlaces en columnas. Antes eran cuatro columnas de texto en una
 * rejilla con la última vacía.
 */
export async function SiteFooter() {
  const configuracion = await configuracionPublica();
  const redes = Object.entries(configuracion.redes).filter(([, url]) => url);

  const columnas = [
    {
      id: "pie-sitio",
      titulo: "El sitio",
      enlaces: [
        { href: "/portafolio", label: "Portafolio" },
        { href: "/servicios", label: "Servicios" },
        { href: "/tienda", label: "Tienda" },
        { href: "/nosotros", label: "Nosotros" },
        { href: "/contacto", label: "Contacto" },
      ],
    },
    {
      id: "pie-cuenta",
      titulo: "Tu pedido",
      enlaces: [
        { href: "/pedido", label: "Pedir un trabajo" },
        { href: "/mi-cuenta", label: "Mi cuenta" },
      ],
    },
  ];

  const enlace =
    "text-ink-muted underline-offset-4 hover:text-ink hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <footer className="bg-canvas-sunken">
      {/* Tira de control en el borde, como en un pliego: las cuatro tintas
          de proceso en el orden en que se imprimen (SPEC.md §9). */}
      <div aria-hidden className="flex h-1">
        <span className="flex-1 bg-tinta-cian" />
        <span className="flex-1 bg-accent" />
        <span className="flex-1 bg-tinta-amarillo" />
        <span className="flex-1 bg-ink" />
      </div>

      <div className="mx-auto grid w-full max-w-content gap-12 px-6 py-16 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-20 lg:px-8">
        <TarjetaDeVisita configuracion={configuracion} />

        <div className="grid content-start gap-10 sm:grid-cols-3">
          {columnas.map((columna) => (
            <nav key={columna.id} aria-labelledby={columna.id}>
              <h2 id={columna.id} className="font-display text-base text-ink">
                {columna.titulo}
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                {columna.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link href={e.href} className={enlace}>
                      {e.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {redes.length > 0 && (
            <nav aria-labelledby="pie-redes">
              <h2 id="pie-redes" className="font-display text-base text-ink">
                Redes
              </h2>
              <ul className="mt-4 flex flex-col gap-2.5 text-sm">
                {redes.map(([red, url]) => (
                  <li key={red}>
                    <a href={url} target="_blank" rel="noreferrer" className={`capitalize ${enlace}`}>
                      {red}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-content flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-ink-muted lg:px-8">
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
