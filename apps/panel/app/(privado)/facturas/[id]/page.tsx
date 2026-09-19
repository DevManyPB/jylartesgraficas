import { leerFactura, variantesParaVender } from "@jyl/core/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { EstadoFactura } from "@/components/facturas/EstadoFactura";
import { FormularioFactura } from "@/components/facturas/FormularioFactura";
import { VistaFactura } from "@/components/facturas/VistaFactura";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Factura — Panel JYL" };

/** Una factura: se edita mientras es borrador; después se consulta, se cobra o se anula (SPEC.md §6.5). */
export default async function DetalleFactura({ params }: PageProps<"/facturas/[id]">) {
  await paginaSoloPara(["admin"]);
  const { id } = await params;
  const factura = await leerFactura(id);
  if (!factura) notFound();
  const borrador = factura.estado === "borrador";
  const variantes = borrador ? await variantesParaVender() : [];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/facturas" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Facturas
      </EnlaceProtegido>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl tabular-nums text-ink">
          {factura.numero ?? `Borrador para ${factura.clienteDatos.nombre || "sin nombre"}`}
        </h1>
        <EstadoFactura estado={factura.estado} />
      </div>
      <div className="mt-8 max-w-5xl">
        {borrador ? (
          <FormularioFactura
            key={`${factura.id}-borrador`}
            id={factura.id}
            inicial={{
              orderId: factura.orderId,
              clienteDatos: factura.clienteDatos,
              lineas: factura.lineas,
              vencimientoEn: factura.vencimientoEn,
            }}
            impuestoPorcentaje={factura.impuestoPorcentaje}
            variantes={variantes}
            pedidoNumero={factura.pedidoNumero}
          />
        ) : (
          // Al emitir o anular cambia el estado: la key monta la vista de nuevo.
          <VistaFactura key={`${factura.id}-${factura.estado}`} factura={factura} />
        )}
      </div>
    </main>
  );
}
