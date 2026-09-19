import { listarServiciosDelPanel } from "@jyl/core/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ListaServicios } from "@/components/servicios/ListaServicios";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Servicios — Panel JYL" };

/** Catálogo de servicios — SPEC.md §6.8. Solo admin. */
export default async function Servicios() {
  await paginaSoloPara(["admin"]);
  const servicios = await listarServiciosDelPanel();
  const sinDescripcion = servicios.filter((s) => s.activo && s.descripcion === "").length;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Servicios</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {servicios.length} en el catálogo, en el orden en que los ve el público.
            {sinDescripcion > 0 && ` ${sinDescripcion} visibles todavía sin descripción.`}
          </p>
        </div>
        <Link
          href="/servicios/nuevo"
          className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover"
        >
          Nuevo servicio
        </Link>
      </div>

      <div className="mt-8 max-w-4xl">
        {servicios.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay servicios. Crea el primero.</p>
        ) : (
          // La key fuerza a rehacer la lista si el servidor devuelve otro
          // conjunto, en vez de seguir mostrando el orden local anterior.
          <ListaServicios key={servicios.map((s) => `${s.id}:${s.orden}`).join()} servicios={servicios} />
        )}
      </div>
    </main>
  );
}
