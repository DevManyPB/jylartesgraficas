"use client";

import { insumoEditableSchema, type InsumoEditable } from "@jyl/core";
import { useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { useProtegerCambios } from "@/components/cambios/CambiosSinGuardar";
import { BarraGuardar } from "@/components/formularios/BarraGuardar";
import { Campo, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson, numeroONulo } from "@/components/formularios/enviar";
import { Seccion } from "@/components/formularios/Seccion";

type DatosInsumo = InsumoEditable & { stockInicial: number };

const esquemaNuevo = z.intersection(insumoEditableSchema, z.object({ stockInicial: z.number().int().nonnegative().default(0) }));

interface FormularioInsumoProps {
  /** Sin id se crea uno nuevo. */
  id?: string;
  inicial: InsumoEditable;
  /**
   * El mismo formulario sirve en su página y dentro de un modal, igual que
   * el de servicios. Dentro del modal: botones al pie, al crear no se navega
   * a ninguna parte, y no se arma la guardia de navegación —lo que hay que
   * vigilar ahí es el cierre del modal, y de eso se encarga el modal.
   */
  onListo?: () => void;
  onCancelar?: () => void;
  /** Para que el modal sepa si hay algo a medio escribir antes de cerrarse. */
  onCambios?: (sucio: boolean) => void;
}

/** Insumos sin venta directa — SPEC.md §6.4. Solo admin los crea y edita. */
export function FormularioInsumo({ id, inicial, onListo, onCancelar, onCambios }: FormularioInsumoProps) {
  const { toast } = useToast();
  const router = useRouter();
  const creando = id === undefined;
  const enModal = onListo !== undefined;

  const { register, handleSubmit, reset, setError, formState } = useForm<DatosInsumo>({
    resolver: zodResolver(creando ? esquemaNuevo : insumoEditableSchema) as unknown as Resolver<DatosInsumo>,
    defaultValues: { ...inicial, stockInicial: 0 },
    mode: "onTouched",
  });
  const { errors, isDirty, isSubmitting } = formState;

  async function guardar(): Promise<boolean> {
    let ok = false;
    await handleSubmit(async (datos) => {
      const r = await enviarJson<{ id?: string }>(creando ? "/api/insumos" : `/api/insumos/${id}`, creando ? "POST" : "PUT", datos);
      if (!r.ok) {
        aplicarErroresDelServidor(r.campos, setError);
        toast({ title: "No se guardó el insumo", description: r.error, variant: "error" });
        return;
      }
      reset(datos);
      ok = true;
      toast({ title: creando ? "Insumo creado" : "Insumo guardado", variant: "success" });

      if (enModal) {
        // Se cierra el modal y la página de detrás se recarga: quien lo usa
        // no se mueve de sitio y ve el cambio donde estaba.
        router.refresh();
        onListo();
      } else if (creando && r.datos.id) {
        router.replace(`/inventario/insumos/${r.datos.id}`);
      } else {
        router.refresh();
      }
    })();
    return ok;
  }

  useProtegerCambios(isDirty && !enModal, guardar);

  useEffect(() => {
    onCambios?.(isDirty);
  }, [isDirty, onCambios]);

  const campos = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo etiqueta="Nombre" error={errors.nombre?.message}>
        {(p) => <input {...p} {...register("nombre")} placeholder="Ej.: Vinilo adhesivo blanco" className={claseEntrada} />}
      </Campo>
      <Campo etiqueta="Se cuenta en" error={errors.unidad?.message}>
        {(p) => <input {...p} {...register("unidad")} placeholder="unidades, hojas, metros, ml…" className={claseEntrada} />}
      </Campo>
      <Campo etiqueta="Stock mínimo" ayuda="Por debajo de esto aparece la alerta." error={errors.stockMinimo?.message}>
        {(p) => <input {...p} {...register("stockMinimo", { setValueAs: (v) => numeroONulo(v) ?? 0 })} inputMode="numeric" className={claseEntrada} />}
      </Campo>
      <Campo etiqueta="Costo unitario (COP)" ayuda="Opcional." error={errors.costoUnitario?.message}>
        {(p) => <input {...p} {...register("costoUnitario", { setValueAs: numeroONulo })} inputMode="numeric" className={claseEntrada} />}
      </Campo>
      <Campo etiqueta="Proveedor" error={errors.proveedor?.message}>
        {(p) => <input {...p} {...register("proveedor")} className={claseEntrada} />}
      </Campo>
      <Campo etiqueta="SKU o referencia" ayuda="Opcional." error={errors.sku?.message}>
        {(p) => <input {...p} {...register("sku")} className={claseEntrada} />}
      </Campo>
      {creando && (
        <Campo etiqueta="Cuánto hay ahora" ayuda="Queda en el historial como primera entrada." error={errors.stockInicial?.message}>
          {(p) => <input {...p} {...register("stockInicial", { setValueAs: (v) => numeroONulo(v) ?? 0 })} inputMode="numeric" className={claseEntrada} />}
        </Campo>
      )}
    </div>
  );

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
      className={enModal ? "flex flex-col gap-6" : "flex flex-col gap-10 pb-28"}
    >
      {/* En el modal el título ya lo pone el modal: una sección con otro
          título encima sería repetirlo. */}
      {enModal ? campos : <Seccion titulo="Insumo">{campos}</Seccion>}

      {enModal ? (
        // Cancelar a la izquierda, como en todos los modales (SPEC.md §5.2).
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onCancelar}
            disabled={isSubmitting}
            className="rounded-md px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas-sunken disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isSubmitting ? "Guardando…" : creando ? "Crear insumo" : "Guardar cambios"}
          </button>
        </div>
      ) : (
        <BarraGuardar visible={isDirty || creando} guardando={isSubmitting} etiqueta={creando ? "Crear insumo" : "Guardar cambios"} />
      )}
    </form>
  );
}
