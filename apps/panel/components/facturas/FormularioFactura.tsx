"use client";

import {
  borradorFacturaSchema,
  calcularTotales,
  MAX_LINEAS_FACTURA,
  totalDeLinea,
  type BorradorFactura,
  type VarianteParaVender,
} from "@jyl/core";
import { ConfirmDialog, useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { useProtegerCambios } from "@/components/cambios/CambiosSinGuardar";
import { BarraGuardar } from "@/components/formularios/BarraGuardar";
import { Campo, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson, numeroONulo } from "@/components/formularios/enviar";
import { Seccion } from "@/components/formularios/Seccion";
import { pesos } from "@/components/pedidos/formato";
import { ElegirVariante } from "./ElegirVariante";

interface FormularioFacturaProps {
  /** Sin id, es una factura nueva. */
  id?: string;
  inicial: BorradorFactura;
  /** El vigente en Configuración; null si todavía no se configuró. */
  impuestoPorcentaje: number | null;
  variantes: VarianteParaVender[];
  pedidoNumero: string | null;
}

const LINEA_VACIA = { descripcion: "", cantidad: 1, precioUnitario: 0, descuento: 0, productId: null, variantId: null };

const numero = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Una factura mientras es borrador — SPEC.md §6.5. Los totales que se ven
 * aquí se calculan con la misma función que el servidor, pero lo que se
 * guarda lo recalcula él (§7 principio 6).
 */
export function FormularioFactura({ id, inicial, impuestoPorcentaje, variantes, pedidoNumero }: FormularioFacturaProps) {
  const { toast } = useToast();
  const router = useRouter();
  const creando = id === undefined;
  const [eligiendo, setEligiendo] = useState(false);
  const [emitiendo, setEmitiendo] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const { register, handleSubmit, reset, setError, control, getValues, formState } = useForm<BorradorFactura>({
    resolver: zodResolver(borradorFacturaSchema) as Resolver<BorradorFactura>,
    defaultValues: inicial,
    mode: "onTouched",
  });
  const { errors, isDirty, isSubmitting } = formState;
  const { fields, append, remove, update } = useFieldArray({ control, name: "lineas" });
  const lineas = useWatch({ control, name: "lineas" });
  const cliente = useWatch({ control, name: "clienteDatos.nombre" });

  const lineasParaCalcular = lineas.map((l) => ({
    cantidad: numero(l.cantidad),
    precioUnitario: numero(l.precioUnitario),
    descuento: numero(l.descuento),
  }));
  const totales = calcularTotales(lineasParaCalcular, impuestoPorcentaje);
  const porVariante = new Map(variantes.map((v) => [`${v.productId}/${v.variantId}`, v]));

  async function guardar(): Promise<boolean> {
    let ok = false;
    await handleSubmit(async (datos) => {
      const r = await enviarJson<{ id?: string }>(creando ? "/api/facturas" : `/api/facturas/${id}`, creando ? "POST" : "PUT", datos);
      if (!r.ok) {
        aplicarErroresDelServidor(r.campos, setError);
        toast({ title: "No se guardó la factura", description: r.error, variant: "error" });
        return;
      }
      reset(getValues());
      ok = true;
      toast({ title: "Borrador guardado", variant: "success" });
      if (creando && r.datos.id) router.replace(`/facturas/${r.datos.id}`);
      else router.refresh();
    })();
    return ok;
  }

  useProtegerCambios(isDirty, guardar);

  const vinculadas = lineas.filter((l) => l.productId && l.variantId);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
      className="flex flex-col gap-10 pb-28"
    >
      {!creando && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-canvas-sunken px-4 py-3">
          <p className="mr-auto text-sm text-ink-muted">
            {isDirty ? "Guarda los cambios antes de emitir." : "Cuando esté lista, emítela: recibe su número y ya no se puede editar."}
          </p>
          <button
            type="button"
            onClick={() => setEliminando(true)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
          >
            Eliminar borrador
          </button>
          <button
            type="button"
            disabled={isDirty}
            onClick={() => setEmitiendo(true)}
            className="rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-ink-inverted hover:bg-accent-hover disabled:opacity-40"
          >
            Emitir factura
          </button>
        </div>
      )}

      <Seccion
        titulo="Cliente"
        descripcion={pedidoNumero ? `Datos tomados del pedido ${pedidoNumero}. Se pueden corregir.` : "A quién se le factura."}
      >
        {pedidoNumero && inicial.orderId && (
          <p className="mb-4 text-sm">
            <Link href={`/pedidos/${inicial.orderId}`} className="text-accent underline-offset-2 hover:underline">
              Ver el pedido {pedidoNumero}
            </Link>
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre o razón social" error={errors.clienteDatos?.nombre?.message}>
            {(p) => <input {...p} {...register("clienteDatos.nombre")} autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Cédula o NIT" ayuda="Opcional." error={errors.clienteDatos?.documento?.message}>
            {(p) => <input {...p} {...register("clienteDatos.documento")} autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Correo" error={errors.clienteDatos?.email?.message}>
            {(p) => <input {...p} {...register("clienteDatos.email")} type="email" autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Teléfono" error={errors.clienteDatos?.telefono?.message}>
            {(p) => <input {...p} {...register("clienteDatos.telefono")} type="tel" autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Dirección" error={errors.clienteDatos?.direccion?.message}>
            {(p) => <input {...p} {...register("clienteDatos.direccion")} autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Ciudad" error={errors.clienteDatos?.ciudad?.message}>
            {(p) => <input {...p} {...register("clienteDatos.ciudad")} autoComplete="off" className={claseEntrada} />}
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Líneas" descripcion="Precios en pesos. El descuento es sobre el total de la línea.">
        <div aria-hidden className="hidden grid-cols-[1fr_5rem_8rem_7rem_7rem_2rem] gap-2 pb-1 text-xs text-ink-muted md:grid">
          <span>Descripción</span>
          <span>Cantidad</span>
          <span>Precio unitario</span>
          <span>Descuento</span>
          <span className="text-right">Total</span>
        </div>
        <ol className="flex flex-col divide-y divide-border border-y border-border">
          {fields.map((campo, i) => {
            const linea = lineas[i];
            const variante = linea?.productId && linea.variantId ? porVariante.get(`${linea.productId}/${linea.variantId}`) : undefined;
            const e = errors.lineas?.[i];
            return (
              <li key={campo.id} className="py-3">
                <div className="grid grid-cols-3 gap-2 md:grid-cols-[1fr_5rem_8rem_7rem_7rem_2rem] md:items-start">
                  <Linea etiqueta="Descripción" error={e?.descripcion?.message} className="col-span-3 md:col-span-1">
                    {(p) => <input {...p} {...register(`lineas.${i}.descripcion`)} autoComplete="off" className={claseEntrada} />}
                  </Linea>
                  <Linea etiqueta="Cantidad" error={e?.cantidad?.message}>
                    {(p) => (
                      <input {...p} {...register(`lineas.${i}.cantidad`, { setValueAs: numeroONulo })} inputMode="numeric" className={claseEntrada} />
                    )}
                  </Linea>
                  <Linea etiqueta="Precio unitario" error={e?.precioUnitario?.message}>
                    {(p) => (
                      <input {...p} {...register(`lineas.${i}.precioUnitario`, { setValueAs: numeroONulo })} inputMode="numeric" className={claseEntrada} />
                    )}
                  </Linea>
                  <Linea etiqueta="Descuento" error={e?.descuento?.message}>
                    {(p) => (
                      <input {...p} {...register(`lineas.${i}.descuento`, { setValueAs: numeroONulo })} inputMode="numeric" className={claseEntrada} />
                    )}
                  </Linea>
                  <p className="col-span-2 self-center text-sm tabular-nums text-ink md:col-span-1 md:py-1.5 md:text-right">
                    <span className="text-xs text-ink-muted md:sr-only">Total de la línea: </span>
                    {pesos.format(Math.max(0, totalDeLinea(lineasParaCalcular[i] ?? LINEA_VACIA)))}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                    aria-label={`Quitar la línea ${i + 1}`}
                    title="Quitar la línea"
                    className="justify-self-end rounded-md px-2 py-1 text-ink-subtle hover:bg-canvas-sunken hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-subtle"
                  >
                    ✕
                  </button>
                </div>
                {linea?.productId && linea.variantId && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                    <span>
                      Descuenta stock · {variante ? `${variante.nombre} (quedan ${variante.stock})` : "variante que ya no está activa"}
                    </span>
                    <button
                      type="button"
                      onClick={() => update(i, { ...getValues(`lineas.${i}`), productId: null, variantId: null })}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Desvincular
                    </button>
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {(errors.lineas?.root?.message ?? errors.lineas?.message) && (
          <p role="alert" className="mt-2 text-xs text-danger">
            {errors.lineas?.root?.message ?? errors.lineas?.message}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={fields.length >= MAX_LINEAS_FACTURA}
            onClick={() => append({ ...LINEA_VACIA }, { focusName: `lineas.${fields.length}.descripcion` })}
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-ink hover:bg-canvas-sunken disabled:opacity-40"
          >
            Agregar línea
          </button>
          <button
            type="button"
            disabled={fields.length >= MAX_LINEAS_FACTURA}
            onClick={() => setEligiendo(true)}
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-ink hover:bg-canvas-sunken disabled:opacity-40"
          >
            Agregar del inventario
          </button>
        </div>
        <ElegirVariante
          open={eligiendo}
          onOpenChange={setEligiendo}
          variantes={variantes}
          onElegir={(v) =>
            append({
              descripcion: v.nombre,
              cantidad: 1,
              precioUnitario: v.precioVenta,
              descuento: 0,
              productId: v.productId,
              variantId: v.variantId,
            })
          }
        />
      </Seccion>

      <Seccion titulo="Totales">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <Campo etiqueta="Vence el" ayuda="Opcional. Hasta cuándo tiene el cliente para pagar." error={errors.vencimientoEn?.message}>
            {(p) => (
              <input
                {...p}
                {...register("vencimientoEn", { setValueAs: (v) => (v ? v : null) })}
                type="date"
                className={`${claseEntrada} sm:w-44`}
              />
            )}
          </Campo>
          <dl className="grid min-w-64 grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm">
            <dt className="text-ink-muted">Subtotal</dt>
            <dd className="text-right tabular-nums text-ink">{pesos.format(totales.subtotal)}</dd>
            <dt className="text-ink-muted">Descuentos</dt>
            <dd className="text-right tabular-nums text-ink">{totales.descuento ? `− ${pesos.format(totales.descuento)}` : pesos.format(0)}</dd>
            <dt className="text-ink-muted">
              Impuesto {impuestoPorcentaje === null ? "(sin configurar)" : `(${impuestoPorcentaje} %)`}
            </dt>
            <dd className="text-right tabular-nums text-ink">{pesos.format(totales.impuesto)}</dd>
            <dt className="border-t border-border pt-1 font-medium text-ink">Total</dt>
            <dd className="border-t border-border pt-1 text-right font-display text-lg tabular-nums text-ink">{pesos.format(totales.total)}</dd>
          </dl>
        </div>
        {impuestoPorcentaje === null && (
          <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-text">
            Para emitir hace falta el porcentaje de impuesto.{" "}
            <Link href="/configuracion" className="font-medium underline underline-offset-2">
              Configúralo
            </Link>{" "}
            (pon 0 si no aplica).
          </p>
        )}
      </Seccion>

      {!creando && (
        <>
          <ConfirmDialog
            open={emitiendo}
            onOpenChange={setEmitiendo}
            title={`¿Emitir la factura de ${cliente || "este cliente"}?`}
            description="Una vez emitida no se puede editar. Si hay un error, habrá que anularla y emitir una nueva."
            confirmLabel="Emitir"
            extra={
              <div className="flex flex-col gap-2 text-sm">
                <p className="font-medium text-ink">
                  Total: <span className="tabular-nums">{pesos.format(totales.total)}</span>
                </p>
                {vinculadas.length > 0 && (
                  <div className="text-ink-muted">
                    Se descontarán del inventario:
                    <ul className="mt-1 list-disc pl-5">
                      {vinculadas.map((l, i) => (
                        <li key={i}>
                          {numero(l.cantidad)} × {l.descripcion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            }
            onConfirm={async () => {
              const r = await enviarJson<{ numero: string }>(`/api/facturas/${id}/emitir`, "POST", {});
              if (!r.ok) {
                toast({ title: "No se emitió la factura", description: r.error, variant: "error" });
                throw new Error("no-emitida");
              }
              toast({ title: `Factura ${r.datos.numero} emitida`, variant: "success" });
              router.refresh();
            }}
          />
          <ConfirmDialog
            open={eliminando}
            onOpenChange={setEliminando}
            variant="destructive"
            title={`¿Eliminar el borrador de ${inicial.clienteDatos.nombre || "este cliente"}?`}
            description="Se borra el borrador. Todavía no tenía número, así que no deja huecos en el consecutivo."
            confirmLabel="Eliminar"
            onConfirm={async () => {
              const r = await fetch(`/api/facturas/${id}`, { method: "DELETE" }).catch(() => null);
              if (!r?.ok) {
                const datos = (await r?.json().catch(() => null)) as { error?: string } | null;
                toast({ title: "No se eliminó el borrador", description: datos?.error ?? "Inténtalo de nuevo.", variant: "error" });
                throw new Error("no-eliminado");
              }
              reset(getValues());
              toast({ title: "Borrador eliminado", variant: "success" });
              router.replace("/facturas");
            }}
          />
        </>
      )}

      <BarraGuardar visible={isDirty || creando} guardando={isSubmitting} etiqueta={creando ? "Crear borrador" : "Guardar borrador"} />
    </form>
  );
}

/** Un campo de la línea: en móvil con su etiqueta encima; en escritorio la da la cabecera de columnas. */
function Linea(props: Omit<Parameters<typeof Campo>[0], "claseEtiqueta">) {
  return <Campo {...props} claseEtiqueta="text-xs font-normal text-ink-muted md:sr-only" />;
}
