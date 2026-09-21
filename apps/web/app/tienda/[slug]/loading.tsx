/**
 * Mientras se lee la ficha del producto — AGENTS.md §8: un estado de carga
 * diseñado, nunca una pantalla en blanco. La silueta es la de la ficha real
 * (foto a la izquierda, texto a la derecha), así que al llegar los datos
 * nada se mueve de sitio.
 */
export default function Cargando() {
  return (
    <main
      aria-busy
      aria-label="Cargando el producto"
      className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8"
    >
      <div className="h-4 w-20 rounded bg-canvas-sunken motion-safe:animate-pulse" />
      <div className="mt-4 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="aspect-square w-full rounded-xl bg-canvas-sunken motion-safe:animate-pulse" />
        <div className="flex flex-col gap-4">
          <div className="h-4 w-24 rounded bg-canvas-sunken motion-safe:animate-pulse" />
          <div className="h-9 w-2/3 rounded bg-canvas-sunken motion-safe:animate-pulse" />
          <div className="h-4 w-full rounded bg-canvas-sunken motion-safe:animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-canvas-sunken motion-safe:animate-pulse" />
          <div className="mt-6 h-12 w-full rounded-xl bg-canvas-sunken motion-safe:animate-pulse" />
          <div className="h-12 w-48 rounded-full bg-canvas-sunken motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  );
}
