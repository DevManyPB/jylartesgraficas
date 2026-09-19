export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tablero — SPEC.md §6.2. Sus cifras salen de `stats/resumen`, que mantiene
 * el servidor al escribir pedidos, stock y facturas; por eso se completa en el
 * bloque 7, cuando esas escrituras existen. Hasta entonces no se muestra
 * ningún número: uno inventado o contado a mano sería peor que ninguno.
 */
export default function Tablero() {
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl text-ink">Tablero</h1>
      <p className="mt-2 max-w-prose text-sm text-ink-muted">
        Aquí vas a ver los pedidos sin atender, las entregas próximas, lo que
        falta por cobrar y el inventario bajo mínimo.
      </p>
    </main>
  );
}
