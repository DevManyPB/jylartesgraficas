import type { BorradorFactura } from "@jyl/core";
import { borradorDesdePedido, leerConfiguracion, variantesParaVender } from "@jyl/core/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { FormularioFactura } from "@/components/facturas/FormularioFactura";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Nueva factura — Panel JYL" };

const VACIA: BorradorFactura = {
  orderId: null,
  clienteDatos: { nombre: "", documento: "", email: "", telefono: "", direccion: "", ciudad: "" },
  lineas: [{ descripcion: "", cantidad: 1, precioUnitario: 0, descuento: 0, productId: null, variantId: null }],
  vencimientoEn: null,
};

/** Factura nueva, en blanco o a partir de un pedido (`?pedido=`) — SPEC.md §6.3 y §6.5. */
export default async function NuevaFactura({ searchParams }: PageProps<"/facturas/nueva">) {
  await paginaSoloPara(["admin"]);
  const pedido = (await searchParams).pedido;
  const orderId = typeof pedido === "string" ? pedido : null;

  const [desdePedido, configuracion, variantes] = await Promise.all([
    orderId ? borradorDesdePedido(orderId) : null,
    leerConfiguracion(),
    variantesParaVender(),
  ]);
  if (orderId && !desdePedido) notFound();

  // Lo del pedido se muestra tal cual, aunque le falte algo (un nombre vacío,
  // p. ej.): el formulario valida al guardar y señala qué completar.
  const inicial: BorradorFactura = desdePedido
    ? {
        orderId: desdePedido.datos.orderId ?? null,
        clienteDatos: { ...VACIA.clienteDatos, ...desdePedido.datos.clienteDatos },
        lineas: desdePedido.datos.lineas.map((l) => ({ ...VACIA.lineas[0]!, ...l })),
        vencimientoEn: null,
      }
    : VACIA;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/facturas" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Facturas
      </EnlaceProtegido>
      <h1 className="mt-1 font-display text-2xl text-ink">Nueva factura</h1>
      <p className="mt-1 text-sm text-ink-muted">Se guarda como borrador. El número se asigna al emitirla.</p>
      <div className="mt-8 max-w-5xl">
        <FormularioFactura
          inicial={inicial}
          impuestoPorcentaje={configuracion.impuestoPorcentaje}
          variantes={variantes}
          pedidoNumero={desdePedido?.pedidoNumero ?? null}
        />
      </div>
    </main>
  );
}
