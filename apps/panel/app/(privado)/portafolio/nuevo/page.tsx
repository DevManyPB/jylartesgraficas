import { categoriasDeProyectos } from "@jyl/core/server";
import type { Metadata } from "next";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { FormularioProyecto } from "@/components/portafolio/FormularioProyecto";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo proyecto — Panel JYL" };

export default async function NuevoProyecto() {
  await paginaSoloPara(["admin"]);
  const categorias = await categoriasDeProyectos();

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/portafolio" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Portafolio
      </EnlaceProtegido>
      <h1 className="mt-1 font-display text-2xl text-ink">Nuevo proyecto</h1>
      <div className="mt-8 max-w-4xl">
        <FormularioProyecto
          categorias={categorias}
          inicial={{ titulo: "", categoria: "", cliente: "", descripcion: "", destacado: false, publicado: false, imagenes: [] }}
        />
      </div>
    </main>
  );
}
