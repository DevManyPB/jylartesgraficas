import Link from "next/link";

/**
 * Andamiaje de la home para poder probar el header (Chunk D).
 * La Fase 2 construye estas secciones de verdad — SPEC.md §4.3.
 */
export default function Home() {
  return (
    <main>
      {/* TODO: contenido pendiente del cliente — aquí va la pieza destacada del
          portafolio a pantalla completa (SPEC.md §4.3). Mientras no haya piezas
          reales, el héroe es un bloque liso. */}
      <section
        data-hero
        className="flex min-h-screen flex-col justify-end bg-canvas-dark px-6 pb-20 text-ink-inverted lg:px-8"
      >
        <div className="mx-auto w-full max-w-content">
          <h1 className="font-display text-5xl sm:text-display lg:text-display-lg">
            JYL Artes Gráficos
          </h1>
          <p className="mt-6 max-w-md text-base text-ink-inverted/70">
            Artes gráficas, desarrollo web y servicios técnicos.
          </p>
          <Link
            href="/pedido"
            className="mt-10 inline-flex rounded-full bg-accent px-6 py-3 text-base font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            Pedir un trabajo
          </Link>
        </div>
      </section>

      {["Portafolio reciente", "Servicios", "Ubicación"].map((titulo) => (
        <section key={titulo} className="border-b border-border px-6 py-24 lg:px-8">
          <div className="mx-auto w-full max-w-content">
            <h2 className="font-display text-3xl text-ink">{titulo}</h2>
            <p className="mt-3 text-sm text-ink-muted">
              Sección pendiente: se construye en la Fase 2.
            </p>
          </div>
        </section>
      ))}
    </main>
  );
}
