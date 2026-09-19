/**
 * Andamio de las rutas que el header ya enlaza pero que se construyen en la
 * Fase 2. Existe para que la navegación y el indicador de página actual se
 * puedan probar de verdad, no para hacer de contenido.
 */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink">{title}</h1>
      <p className="mt-4 max-w-prose text-base text-ink-muted">
        Sección pendiente: se construye en la Fase 2.
      </p>
    </main>
  );
}
