"use client";

import { NOMBRE_METODO_PAGO, totalDeLinea, type FacturaDelPanel } from "@jyl/core";
import { ConfirmDialog, useToast } from "@jyl/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/components/formularios/enviar";
import { formatearDia, formatearFechaLarga, pesos } from "@/components/pedidos/formato";
import { RegistrarPago } from "./RegistrarPago";

/**
 * Una factura emitida, pagada o anulada — SPEC.md §6.5. Ya no se edita: se
 * le registran pagos, se descarga en PDF o se anula con motivo.
 */
export function VistaFactura({ factura }: { factura: FacturaDelPanel }) {
  const { toast } = useToast();
  const router = useRouter();
  const [pagando, setPagando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const numero = factura.numero ?? "";
  const c = factura.clienteDatos;

  async function descargar() {
    setGenerando(true);
    try {
      const { descargarPdfFactura } = await import("./pdf");
      await descargarPdfFactura(factura);
    } catch {
      toast({ title: "No se pudo generar el PDF", description: "Inténtalo de nuevo.", variant: "error" });
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={descargar}
          disabled={generando}
          className="rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-ink hover:bg-canvas-sunken disabled:opacity-60"
        >
          {generando ? "Generando…" : "Descargar PDF"}
        </button>
        {factura.estado === "emitida" && (
          <button
            type="button"
            onClick={() => setPagando(true)}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-ink-inverted hover:bg-accent-hover"
          >
            Registrar pago
          </button>
        )}
        {factura.estado !== "anulada" && (
          <button
            type="button"
            onClick={() => setAnulando(true)}
            className="ml-auto rounded-md px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
          >
            Anular factura
          </button>
        )}
      </div>

      {factura.anulacion && (
        <p className="rounded-md bg-canvas-sunken px-4 py-3 text-sm text-ink">
          Anulada {factura.anulacion.fecha ? `el ${formatearFechaLarga(factura.anulacion.fecha)}` : ""}
          {factura.anulacion.autor ? ` por ${factura.anulacion.autor}` : ""}. Motivo: «{factura.anulacion.motivo}».
          {factura.stockDescontado && " El stock que había descontado se devolvió al inventario."}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="factura-cliente">
          <h2 id="factura-cliente" className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Facturar a
          </h2>
          <p className="mt-1 font-medium text-ink">{c.nombre}</p>
          <div className="text-sm text-ink-muted">
            {c.documento && <p>C.C./NIT {c.documento}</p>}
            {(c.direccion || c.ciudad) && <p>{[c.direccion, c.ciudad].filter(Boolean).join(", ")}</p>}
            {(c.telefono || c.email) && <p>{[c.telefono, c.email].filter(Boolean).join(" · ")}</p>}
          </div>
        </section>
        <section aria-labelledby="factura-datos" className="text-sm sm:text-right">
          <h2 id="factura-datos" className="sr-only">
            Datos de la factura
          </h2>
          <p className="text-ink-muted">Emitida {formatearFechaLarga(factura.emitidaEn)}</p>
          {factura.vencimientoEn && <p className="text-ink-muted">Vence el {formatearDia(factura.vencimientoEn)}</p>}
          {factura.orderId && factura.pedidoNumero && (
            <p>
              <Link href={`/pedidos/${factura.orderId}`} className="text-accent underline-offset-2 hover:underline">
                Pedido {factura.pedidoNumero}
              </Link>
            </p>
          )}
        </section>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <caption className="sr-only">Líneas de la factura</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs text-ink-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Descripción</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Cant.</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Precio unit.</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Descuento</th>
              <th scope="col" className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {factura.lineas.map((l, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-2 pr-4 text-ink">
                  {l.descripcion}
                  {l.variantId && <span className="block text-xs text-ink-subtle">Del inventario</span>}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums">{l.cantidad}</td>
                <td className="py-2 pr-4 text-right tabular-nums">{pesos.format(l.precioUnitario)}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-ink-muted">{l.descuento ? `− ${pesos.format(l.descuento)}` : "—"}</td>
                <td className="py-2 text-right tabular-nums">{pesos.format(totalDeLinea(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="text-right tabular-nums">{pesos.format(factura.subtotal)}</dd>
        <dt className="text-ink-muted">Descuentos</dt>
        <dd className="text-right tabular-nums">{factura.descuento ? `− ${pesos.format(factura.descuento)}` : pesos.format(0)}</dd>
        <dt className="text-ink-muted">Impuesto ({factura.impuestoPorcentaje ?? 0} %)</dt>
        <dd className="text-right tabular-nums">{pesos.format(factura.impuesto)}</dd>
        <dt className="border-t border-border pt-1 font-medium">Total</dt>
        <dd className="border-t border-border pt-1 text-right font-display text-lg tabular-nums">{pesos.format(factura.total)}</dd>
        {factura.estado === "emitida" && (
          <>
            <dt className="font-medium text-warning">Por cobrar</dt>
            <dd className="text-right font-medium tabular-nums text-warning">{pesos.format(factura.saldo)}</dd>
          </>
        )}
      </dl>

      <section aria-labelledby="factura-pagos" className="border-t border-border pt-6">
        <h2 id="factura-pagos" className="font-display text-base text-ink">
          Pagos
        </h2>
        {factura.pagos.length === 0 ? (
          <p className="mt-2 text-sm text-ink-muted">Todavía no se ha registrado ningún pago.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border border-y border-border text-sm">
            {factura.pagos.map((p, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2">
                <span>
                  {formatearDia(p.fecha)} · {NOMBRE_METODO_PAGO[p.metodo]}
                  {p.registradoPor && <span className="ml-2 text-xs text-ink-subtle">registró {p.registradoPor}</span>}
                </span>
                <span className="tabular-nums">{pesos.format(p.monto)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {factura.estado === "emitida" && (
        <RegistrarPago open={pagando} onOpenChange={setPagando} facturaId={factura.id} numero={numero} saldo={factura.saldo} />
      )}
      <ConfirmDialog
        open={anulando}
        onOpenChange={setAnulando}
        variant="destructive"
        title={`¿Anular la factura ${numero}?`}
        description={
          <>
            El número queda registrado como anulado y no se puede reutilizar. Para corregirla, emite una nueva.
            {factura.stockDescontado && " El stock que descontó vuelve al inventario."}
            {factura.pagos.length > 0 && " Los pagos registrados quedan en la factura anulada; la devolución al cliente se hace aparte."}
          </>
        }
        confirmLabel="Anular"
        confirmationRequirement={{ type: "reason" }}
        onConfirm={async (motivo) => {
          const r = await enviarJson(`/api/facturas/${factura.id}/anular`, "POST", { motivo });
          if (!r.ok) {
            toast({ title: "No se anuló la factura", description: r.error, variant: "error" });
            throw new Error("no-anulada");
          }
          toast({ title: `${numero} anulada`, variant: "success" });
          router.refresh();
        }}
      />
    </div>
  );
}
