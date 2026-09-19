import type { Metadata } from "next";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { FormularioInsumo } from "@/components/inventario/FormularioInsumo";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nuevo insumo — Panel JYL" };

export default async function NuevoInsumo() {
  await paginaSoloPara(["admin"]);
  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/inventario/insumos" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Insumos
      </EnlaceProtegido>
      <h1 className="mt-1 font-display text-2xl text-ink">Nuevo insumo</h1>
      <div className="mt-8 max-w-4xl">
        <FormularioInsumo inicial={{ nombre: "", sku: "", unidad: "", stockMinimo: 0, costoUnitario: null, proveedor: "" }} />
      </div>
    </main>
  );
}
