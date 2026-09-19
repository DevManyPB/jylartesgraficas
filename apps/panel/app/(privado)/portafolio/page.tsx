import { listarProyectos } from "@jyl/core/server";
import type { Metadata } from "next";
import Link from "next/link";
import { ListaProyectos } from "@/components/portafolio/ListaProyectos";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Portafolio — Panel JYL" };

/** Portafolio — SPEC.md §6.7. Lo edita el admin. */
export default async function Portafolio({ searchParams }: PageProps<"/portafolio">) {
  await paginaSoloPara(["admin"]);
  const desde = (await searchParams).desde;
  const pagina = await listarProyectos(typeof desde === "string" ? desde : undefined);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-ink">Portafolio</h1>
          <p className="mt-1 text-sm text-ink-muted">En el orden en que se ve en el sitio.</p>
        </div>
        <Link href="/portafolio/nuevo" className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink-inverted hover:bg-accent-hover">
          Nuevo proyecto
        </Link>
      </div>

      <div className="mt-6 max-w-4xl">
        {pagina.filas.length === 0 ? (
          <p className="border-y border-border py-8 text-center text-sm text-ink-muted">
            Todavía no hay proyectos. El portafolio es lo primero que mira un cliente: vale la pena empezar por aquí.
          </p>
        ) : (
          <ListaProyectos proyectos={pagina.filas} />
        )}
        {pagina.siguiente && (
          <Link href={`/portafolio?desde=${pagina.siguiente}`} className="mt-4 inline-block text-sm text-accent hover:underline">
            Ver más proyectos
          </Link>
        )}
      </div>
    </main>
  );
}
