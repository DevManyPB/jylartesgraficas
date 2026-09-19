import { categoriasDeProyectos, leerProyecto } from "@jyl/core/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { FormularioProyecto } from "@/components/portafolio/FormularioProyecto";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Proyecto — Panel JYL" };

export default async function EditarProyecto({ params }: PageProps<"/portafolio/[id]">) {
  await paginaSoloPara(["admin"]);
  const { id } = await params;
  const [proyecto, categorias] = await Promise.all([leerProyecto(id), categoriasDeProyectos()]);
  if (!proyecto) notFound();

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/portafolio" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Portafolio
      </EnlaceProtegido>
      <h1 className="mt-1 font-display text-2xl text-ink">{proyecto.titulo}</h1>
      <p className="mt-1 text-sm text-ink-muted">{proyecto.publicado ? "Publicado en el sitio" : "Borrador: el público no lo ve"}</p>
      <div className="mt-8 max-w-4xl">
        <FormularioProyecto
          key={proyecto.id}
          id={proyecto.id}
          categorias={categorias}
          inicial={{
            titulo: proyecto.titulo,
            categoria: proyecto.categoria,
            cliente: proyecto.cliente,
            descripcion: proyecto.descripcion,
            destacado: proyecto.destacado,
            publicado: proyecto.publicado,
            imagenes: proyecto.imagenes.map(({ publicId, alt, url }) => ({ publicId, alt, url })),
          }}
        />
      </div>
    </main>
  );
}
