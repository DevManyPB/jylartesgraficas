import { cn } from "@jyl/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { GaleriaPortafolio } from "@/components/portafolio/GaleriaPortafolio";
import { proyectosPublicos } from "@/datos/cache";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Portafolio — JYL Artes Gráficos",
  description: "Trabajos hechos en el estudio: publicidad, diseño gráfico y web.",
};

/** Portafolio — SPEC.md §4.3, con filtro por categoría. */
export default async function Portafolio({ searchParams }: PageProps<"/portafolio">) {
  const proyectos = await proyectosPublicos();
  const pedida = (await searchParams).categoria;
  const categorias = [...new Set(proyectos.map((p) => p.categoria).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  // Una categoría que ya no existe no deja la página vacía sin explicación.
  const categoria = typeof pedida === "string" && categorias.includes(pedida) ? pedida : null;
  const visibles = categoria ? proyectos.filter((p) => p.categoria === categoria) : proyectos;

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Portafolio</h1>
      <p className="mt-4 max-w-prose text-base text-ink-muted">
        Trabajos que han salido del estudio. Toca una pieza para verla completa.
      </p>

      {categorias.length > 1 && (
        <nav aria-label="Filtrar por categoría" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            {[{ valor: null, nombre: "Todo" }, ...categorias.map((c) => ({ valor: c, nombre: c }))].map((filtro) => {
              const activo = filtro.valor === categoria;
              return (
                <li key={filtro.nombre}>
                  <Link
                    href={filtro.valor ? `/portafolio?categoria=${encodeURIComponent(filtro.valor)}` : "/portafolio"}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "block rounded-full border px-4 py-1.5 text-sm transition-colors",
                      activo
                        ? "border-ink bg-ink text-ink-inverted"
                        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {filtro.nombre}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {visibles.length > 0 ? (
        <GaleriaPortafolio proyectos={visibles} />
      ) : (
        <p className="mt-12 rounded-xl border border-border bg-canvas-sunken p-6 text-sm text-ink-muted">
          {proyectos.length === 0
            ? "Estamos preparando esta sección con trabajos recientes."
            : "No hay piezas en esa categoría todavía."}
        </p>
      )}
    </main>
  );
}
