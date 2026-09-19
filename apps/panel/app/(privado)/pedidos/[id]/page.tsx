import { NOMBRE_CAMPO_EXTRA, NOMBRE_ESTADO } from "@jyl/core";
import { leerPedidoDelPanel } from "@jyl/core/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { CambiarEstado } from "@/components/pedidos/CambiarEstado";
import { EstadoPedido } from "@/components/pedidos/EstadoPedido";
import {
  enlaceWhatsapp,
  formatearDia,
  formatearFechaCorta,
  formatearFechaLarga,
  pesos,
} from "@/components/pedidos/formato";
import { GaleriaReferencias } from "@/components/pedidos/GaleriaReferencias";
import { NotasInternas } from "@/components/pedidos/NotasInternas";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pedido — Panel JYL" };

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h2 className="text-[13px] font-medium text-ink-muted">{titulo}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}

/** Detalle de un pedido — SPEC.md §6.3. Admin y operador. */
export default async function DetallePedido({ params }: PageProps<"/pedidos/[id]">) {
  await paginaSoloPara(["admin", "operador"]);
  const { id } = await params;
  const pedido = await leerPedidoDelPanel(id);
  if (!pedido) notFound();

  const { contacto } = pedido;
  const whatsapp = contacto.telefono ? enlaceWhatsapp(contacto.telefono) : null;

  const datos: [string, string][] = [
    ...(pedido.medidas ? [["Medidas", pedido.medidas] as [string, string]] : []),
    ...(pedido.material ? [["Material", pedido.material] as [string, string]] : []),
    ...Object.entries(pedido.camposExtra)
      .filter(([, valor]) => valor)
      .map(([clave, valor]) => [NOMBRE_CAMPO_EXTRA[clave] ?? clave, valor] as [string, string]),
    ...(pedido.fechaDeseada ? [["Para cuándo", formatearDia(pedido.fechaDeseada)] as [string, string]] : []),
    ...(pedido.presupuestoAprox !== null
      ? [["Presupuesto aproximado", pesos.format(pedido.presupuestoAprox)] as [string, string]]
      : []),
  ];

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <EnlaceProtegido href="/pedidos" className="text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline">
        Pedidos
      </EnlaceProtegido>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 className="font-display text-2xl tabular-nums text-ink">{pedido.numero}</h1>
        <EstadoPedido estado={pedido.estado} />
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        {pedido.servicio ?? "Productos de la tienda"} · recibido el {formatearFechaLarga(pedido.creadoEn)}
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Bloque titulo="Lo que pide">
            <p className="max-w-prose whitespace-pre-line text-sm text-ink">{pedido.detalle}</p>
            {datos.length > 0 && (
              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {datos.map(([etiqueta, valor]) => (
                  <div key={etiqueta}>
                    <dt className="text-xs text-ink-muted">{etiqueta}</dt>
                    <dd className="text-ink">{valor}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Bloque>

          <Bloque titulo={`Referencias (${pedido.archivosDetalle.length})`}>
            {pedido.archivosIncompletos && (
              <p role="note" className="mb-3 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning">
                Algunas referencias no llegaron bien al enviar el pedido. Pídele al cliente los archivos que falten.
              </p>
            )}
            {pedido.archivosDetalle.length > 0 ? (
              <GaleriaReferencias archivos={pedido.archivosDetalle} numero={pedido.numero} />
            ) : (
              !pedido.archivosIncompletos && <p className="text-sm text-ink-muted">El cliente no adjuntó archivos.</p>
            )}
          </Bloque>

          <Bloque titulo="Historial">
            <ol className="flex flex-col gap-3">
              {pedido.eventos.map((evento) => (
                <li key={evento.id} className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
                  <span aria-hidden className="mt-1.5 h-2 w-2 rounded-full bg-border-strong" />
                  <div>
                    <p className="text-ink">
                      {evento.tipo === "estado" && evento.estadoNuevo
                        ? `${evento.estadoAnterior ? NOMBRE_ESTADO[evento.estadoAnterior] : "—"} → ${NOMBRE_ESTADO[evento.estadoNuevo]}`
                        : evento.mensaje || "Pedido recibido."}
                    </p>
                    {evento.tipo === "estado" && evento.mensaje && (
                      <p className="text-ink-muted">“{evento.mensaje}”</p>
                    )}
                    <p className="text-xs text-ink-subtle">
                      {formatearFechaCorta(evento.creadoEn)}
                      {evento.autor ? ` · ${evento.autor}` : evento.tipo === "creado" ? " · el cliente" : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Bloque>
        </div>

        <aside className="flex flex-col gap-6">
          <Bloque titulo={contacto.conCuenta ? "Cliente con cuenta" : "Cliente invitado"}>
            <p className="text-sm font-medium text-ink">{contacto.nombre || "Sin nombre"}</p>
            {contacto.ciudad && <p className="text-sm text-ink-muted">{contacto.ciudad}</p>}
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {contacto.telefono && (
                <li className="flex flex-wrap gap-x-3">
                  <a href={`tel:${contacto.telefono.replace(/\s/g, "")}`} className="tabular-nums text-ink underline-offset-2 hover:underline">
                    {contacto.telefono}
                  </a>
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="text-accent underline-offset-2 hover:underline">
                      Escribir por WhatsApp
                    </a>
                  )}
                </li>
              )}
              {contacto.email && (
                <li>
                  <a href={`mailto:${contacto.email}?subject=${encodeURIComponent(`Tu pedido ${pedido.numero}`)}`} className="break-all text-ink underline-offset-2 hover:underline">
                    {contacto.email}
                  </a>
                </li>
              )}
              {!contacto.telefono && !contacto.email && (
                <li className="text-ink-muted">Sin datos de contacto guardados.</li>
              )}
            </ul>
          </Bloque>

          <Bloque titulo="Estado">
            {/* La key reinicia la selección cuando el estado cambia. */}
            <CambiarEstado key={pedido.estado} pedidoId={pedido.id} numero={pedido.numero} actual={pedido.estado} />
          </Bloque>

          <Bloque titulo="Notas">
            <NotasInternas pedidoId={pedido.id} inicial={pedido.notasInternas} />
          </Bloque>
        </aside>
      </div>
    </main>
  );
}
