import { servicioEditableSchema } from "@jyl/core";
import { leerServicioDelPanel } from "@jyl/core/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Volver } from "@/components/navegacion/Volver";
import { FormularioServicio } from "@/components/servicios/FormularioServicio";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Servicio — Panel JYL" };

export default async function EditarServicio({ params }: PageProps<"/servicios/[id]">) {
  await paginaSoloPara(["admin"]);
  const { id } = await params;
  const servicio = await leerServicioDelPanel(id);
  if (!servicio) notFound();

  // El esquema descarta lo que no se edita (id, orden): es el mismo filtro
  // que aplica el servidor al guardar.
  const editable = servicioEditableSchema.parse(servicio);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <Volver href="/servicios">
        Servicios
      </Volver>
      <h1 className="mt-1 font-display text-2xl text-ink">{servicio.nombre}</h1>
      <p className="mt-1 text-xs text-ink-subtle">Identificador: {servicio.id}</p>
      <div className="mt-8 max-w-4xl">
        {/* La key reinicia el formulario si se navega de un servicio a otro. */}
        <FormularioServicio key={servicio.id} id={servicio.id} inicial={editable} />
      </div>
    </main>
  );
}
