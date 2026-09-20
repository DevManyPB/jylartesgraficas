import { leerCliente } from "@jyl/core/server";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { EstadoFactura } from "@/components/facturas/EstadoFactura";
import { EstadoPedido } from "@/components/pedidos/EstadoPedido";
import { enlaceWhatsapp, formatearFechaCorta, formatearFechaLarga, pesos } from "@/components/pedidos/formato";
import { NotasInternas } from "@/components/pedidos/NotasInternas";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Cliente — Panel JYL" };

/** Ficha del cliente — SPEC.md §6.6. Solo admin: muestra lo facturado. */
export default async function FichaCliente({ params }: PageProps<"/clientes/[uid]">) {
  await paginaSoloPara(["admin"]);
  const { uid } = await params;
  const cliente = await leerCliente(uid);
  if (!cliente) notFound();

  const whatsapp = cliente.telefono ? enlaceWhatsapp(cliente.telefono) : null;

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/clientes" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Clientes
      </EnlaceProtegido>
      <h1 className="mt-1 font-display text-2xl text-ink">{cliente.nombre || "Cliente sin nombre"}</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Cuenta creada el {formatearFechaLarga(cliente.creadoEn)}
        {cliente.ciudad && ` · ${cliente.ciudad}`}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="cliente-cifras" className="border-t border-border pt-4">
            <h2 id="cliente-cifras" className="text-[13px] font-medium text-ink-muted">
              Resumen
            </h2>
            <dl className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <dt className="text-xs text-ink-muted">Total facturado</dt>
                <dd className="font-display text-xl tabular-nums text-ink">{pesos.format(cliente.totalFacturado)}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Por cobrar</dt>
                <dd className={`font-display text-xl tabular-nums ${cliente.porCobrar > 0 ? "text-warning" : "text-ink"}`}>
                  {pesos.format(cliente.porCobrar)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Pedidos</dt>
                <dd className="font-display text-xl tabular-nums text-ink">{cliente.pedidos.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-muted">Facturas</dt>
                <dd className="font-display text-xl tabular-nums text-ink">{cliente.facturas.length}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="cliente-pedidos" className="border-t border-border pt-4">
            <h2 id="cliente-pedidos" className="text-[13px] font-medium text-ink-muted">
              Pedidos
            </h2>
            {cliente.pedidos.length > 0 ? (
              <ul className="mt-2 divide-y divide-border text-sm">
                {cliente.pedidos.map((pedido) => (
                  <li key={pedido.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="font-medium tabular-nums text-ink underline-offset-2 hover:underline"
                    >
                      {pedido.numero}
                    </Link>
                    <span className="flex items-center gap-3">
                      <EstadoPedido estado={pedido.estado} />
                      <span className="text-ink-muted">{formatearFechaCorta(pedido.creadoEn)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">Todavía no ha hecho ningún pedido.</p>
            )}
          </section>

          <section aria-labelledby="cliente-facturas" className="border-t border-border pt-4">
            <h2 id="cliente-facturas" className="text-[13px] font-medium text-ink-muted">
              Facturas
            </h2>
            {cliente.facturas.length > 0 ? (
              <ul className="mt-2 divide-y divide-border text-sm">
                {cliente.facturas.map((factura) => (
                  <li key={factura.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                    <Link
                      href={`/facturas/${factura.id}`}
                      className="font-medium tabular-nums text-ink underline-offset-2 hover:underline"
                    >
                      {factura.numero ?? "Borrador"}
                    </Link>
                    <span className="flex items-center gap-3">
                      <span className="tabular-nums text-ink">{pesos.format(factura.total)}</span>
                      {factura.saldo > 0 && (
                        <span className="tabular-nums text-warning">faltan {pesos.format(factura.saldo)}</span>
                      )}
                      <EstadoFactura estado={factura.estado} />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">Todavía no tiene facturas.</p>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-6">
          <section aria-labelledby="cliente-contacto" className="border-t border-border pt-4">
            <h2 id="cliente-contacto" className="text-[13px] font-medium text-ink-muted">
              Contacto
            </h2>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {cliente.telefono && (
                <li className="flex flex-wrap gap-x-3">
                  <a href={`tel:${cliente.telefono.replace(/\s/g, "")}`} className="tabular-nums text-ink underline-offset-2 hover:underline">
                    {cliente.telefono}
                  </a>
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
                      WhatsApp
                    </a>
                  )}
                </li>
              )}
              {cliente.email && (
                <li>
                  <a href={`mailto:${cliente.email}`} className="break-all text-ink underline-offset-2 hover:underline">
                    {cliente.email}
                  </a>
                </li>
              )}
            </ul>
          </section>

          <section aria-labelledby="cliente-notas" className="border-t border-border pt-4">
            <h2 id="cliente-notas" className="sr-only">
              Notas
            </h2>
            <NotasInternas
              endpoint={`/api/clientes/${cliente.uid}/notas`}
              campo="notas"
              etiqueta="Notas del cliente"
              inicial={cliente.notas}
            />
          </section>
        </aside>
      </div>
    </main>
  );
}
