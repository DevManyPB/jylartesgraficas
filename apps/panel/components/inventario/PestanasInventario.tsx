import { cn } from "@jyl/ui";
import Link from "next/link";

/** Productos e insumos son dos inventarios con las mismas reglas (SPEC.md §6.4). */
export function PestanasInventario({ actual }: { actual: "productos" | "insumos" }) {
  const pestanas = [
    { id: "productos", nombre: "Productos", href: "/inventario" },
    { id: "insumos", nombre: "Insumos", href: "/inventario/insumos" },
  ] as const;

  return (
    <nav aria-label="Inventario" className="mt-4 flex gap-1 border-b border-border">
      {pestanas.map((p) => (
        <Link
          key={p.id}
          href={p.href}
          aria-current={p.id === actual ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
            p.id === actual ? "border-accent font-medium text-ink" : "border-transparent text-ink-muted hover:text-ink",
          )}
        >
          {p.nombre}
        </Link>
      ))}
    </nav>
  );
}
