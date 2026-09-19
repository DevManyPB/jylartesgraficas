import { leerConfiguracion } from "@jyl/core/server";
import type { Metadata } from "next";
import { FormularioConfiguracion } from "@/components/configuracion/FormularioConfiguracion";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Configuración — Panel JYL" };

/** SPEC.md §6.8. Solo admin: el operador no ve configuración (§6.1). */
export default async function Configuracion() {
  await paginaSoloPara(["admin"]);
  const configuracion = await leerConfiguracion();

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="font-display text-2xl text-ink">Configuración</h1>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        Datos del estudio que usan el sitio público y las facturas.
      </p>
      <div className="mt-8 max-w-4xl">
        <FormularioConfiguracion inicial={configuracion} />
      </div>
    </main>
  );
}
