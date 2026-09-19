"use client";

import { varianteNuevaSchema, type VarianteDelPanel } from "@jyl/core";
import { Modal, useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { Campo, Casilla, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson, numeroONulo } from "@/components/formularios/enviar";

interface DatosVariante {
  talla: string;
  color: string;
  sku: string;
  stockMinimo: number;
  costoUnitario: number | null;
  precioVenta: number;
  activo: boolean;
  stockInicial: number;
}

interface FormularioVarianteProps {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  productId: string;
  /** Sin variante, se crea una nueva. */
  variante?: VarianteDelPanel;
}

const VACIA: DatosVariante = {
  talla: "",
  color: "",
  sku: "",
  stockMinimo: 0,
  costoUnitario: null,
  precioVenta: 0,
  activo: true,
  stockInicial: 0,
};

/**
 * Crear o editar una variante, en modal. Al editar no aparece el stock: solo
 * cambia registrando un movimiento (SPEC.md §6.4). Al crear, "cuántas hay" se
 * registra como la primera entrada del historial.
 */
export function FormularioVariante({ open, onOpenChange, productId, variante }: FormularioVarianteProps) {
  const { toast } = useToast();
  const router = useRouter();
  const creando = !variante;

  const { register, handleSubmit, reset, setError, formState } = useForm<DatosVariante>({
    resolver: zodResolver(varianteNuevaSchema) as unknown as Resolver<DatosVariante>,
    defaultValues: variante ? { ...variante, stockInicial: 0 } : VACIA,
    mode: "onTouched",
  });
  const { errors, isDirty, isSubmitting } = formState;

  function cerrar(abrir: boolean) {
    if (!abrir) reset(variante ? { ...variante, stockInicial: 0 } : VACIA);
    onOpenChange(abrir);
  }

  const enviar = handleSubmit(async (datos) => {
    // Al editar, el esquema del servidor descarta `stockInicial` (y el stock):
    // se puede mandar el formulario tal cual en los dos casos.
    const resultado = creando
      ? await enviarJson(`/api/productos/${productId}/variantes`, "POST", datos)
      : await enviarJson(`/api/productos/${productId}/variantes/${variante.id}`, "PUT", datos);

    if (!resultado.ok) {
      aplicarErroresDelServidor(resultado.campos, setError);
      toast({ title: "No se guardó la variante", description: resultado.error, variant: "error" });
      return;
    }
    toast({ title: creando ? "Variante creada" : "Variante guardada", variant: "success" });
    cerrar(false);
    router.refresh();
  });

  return (
    <Modal open={open} onOpenChange={cerrar} locked={isSubmitting} closeOnOutsideClick={!isDirty} size="lg">
      <form onSubmit={enviar} noValidate className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <Modal.Title className="font-display text-xl text-ink">{creando ? "Nueva variante" : "Editar variante"}</Modal.Title>
          <Modal.Close aria-label="Cerrar" disabled={isSubmitting} className="text-ink-subtle hover:text-ink">
            ✕
          </Modal.Close>
        </div>
        <Modal.Description className="sr-only">Talla, color, precios y stock mínimo de la variante.</Modal.Description>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Color" error={errors.color?.message}>
            {(p) => <input {...p} {...register("color")} placeholder="Ej.: Negra" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Talla" error={errors.talla?.message}>
            {(p) => <input {...p} {...register("talla")} placeholder="Ej.: M" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Precio de venta (COP)" error={errors.precioVenta?.message}>
            {(p) => <input {...p} {...register("precioVenta", { setValueAs: numeroONulo })} inputMode="numeric" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Costo unitario (COP)" ayuda="Opcional. Solo lo ve el admin." error={errors.costoUnitario?.message}>
            {(p) => <input {...p} {...register("costoUnitario", { setValueAs: numeroONulo })} inputMode="numeric" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Stock mínimo" ayuda="Por debajo de esto aparece la alerta." error={errors.stockMinimo?.message}>
            {(p) => <input {...p} {...register("stockMinimo", { setValueAs: (v) => numeroONulo(v) ?? 0 })} inputMode="numeric" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="SKU" ayuda="Opcional." error={errors.sku?.message}>
            {(p) => <input {...p} {...register("sku")} className={claseEntrada} />}
          </Campo>
          {creando && (
            <Campo etiqueta="Cuántas hay ahora" ayuda="Queda en el historial como primera entrada." error={errors.stockInicial?.message}>
              {(p) => <input {...p} {...register("stockInicial", { setValueAs: (v) => numeroONulo(v) ?? 0 })} inputMode="numeric" className={claseEntrada} />}
            </Campo>
          )}
        </div>

        <Casilla etiqueta="Disponible en la tienda" ayuda="Desmarcada, no se ofrece aunque tenga stock.">
          {({ id }) => <input id={id} type="checkbox" {...register("activo")} className="mt-0.5 h-4 w-4 accent-accent" />}
        </Casilla>

        <div className="mt-2 flex justify-end gap-3">
          <Modal.Close asChild>
            <button type="button" disabled={isSubmitting} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted hover:bg-canvas-sunken">
              Cancelar
            </button>
          </Modal.Close>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-inverted hover:bg-accent-hover disabled:opacity-40">
            {isSubmitting ? "Guardando…" : creando ? "Crear variante" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
