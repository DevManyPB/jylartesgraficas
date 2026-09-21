import { listarServiciosDelPanel } from "@jyl/core/server";
import type { Metadata } from "next";
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
      <div>
        <h1 className="font-display text-2xl text-ink">Servicios</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {servicios.length} en el catálogo, en el orden en que los ve el público.
          {sinDescripcion > 0 && ` ${sinDescripcion} visibles todavía sin descripción.`}
        </p>
      </div>

      <div className="mt-8 max-w-4xl">
        {/* Crear y editar viven dentro de la lista, en un modal: el botón de
            "Nuevo" va ahí y no aquí, para que no haya dos. La key fuerza a
            rehacer la lista si el servidor devuelve otro conjunto, en vez de
            seguir mostrando el orden local anterior. */}
        <ListaServicios key={servicios.map((s) => `${s.id}:${s.orden}`).join()} servicios={servicios} />
      </div>
    </main>
  );
}
