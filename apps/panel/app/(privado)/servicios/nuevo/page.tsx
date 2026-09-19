import type { Metadata } from "next";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { FormularioServicio } from "@/components/servicios/FormularioServicio";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo servicio — Panel JYL" };

export default async function NuevoServicio() {
  await paginaSoloPara(["admin"]);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/servicios" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Servicios
      </EnlaceProtegido>
      <h1 className="mt-1 font-display text-2xl text-ink">Nuevo servicio</h1>
      <div className="mt-8 max-w-4xl">
        <FormularioServicio
          inicial={{
            nombre: "",
            categoria: "publicidad",
            descripcion: "",
            precioBase: null,
            activo: true,
            requiereMedidas: false,
            requiereReferencias: true,
          }}
        />
      </div>
    </main>
  );
}
