"use client";

import { insumoEditableSchema, type InsumoEditable } from "@jyl/core";
import { useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { useProtegerCambios } from "@/components/cambios/CambiosSinGuardar";
import { BarraGuardar } from "@/components/formularios/BarraGuardar";
import { Campo, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson, numeroONulo } from "@/components/formularios/enviar";
import { Seccion } from "@/components/formularios/Seccion";

type DatosInsumo = InsumoEditable & { stockInicial: number };

const esquemaNuevo = z.intersection(insumoEditableSchema, z.object({ stockInicial: z.number().int().nonnegative().default(0) }));

/** Insumos sin venta directa — SPEC.md §6.4. Solo admin los crea y edita. */
export function FormularioInsumo({ id, inicial }: { id?: string; inicial: InsumoEditable }) {
  const { toast } = useToast();
  const router = useRouter();
  const creando = id === undefined;

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
      if (creando && r.datos.id) router.replace(`/inventario/insumos/${r.datos.id}`);
      else router.refresh();
    })();
    return ok;
  }

  useProtegerCambios(isDirty, guardar);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
      className="flex flex-col gap-10 pb-28"
    >
      <Seccion titulo="Insumo">
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
      </Seccion>
      <BarraGuardar visible={isDirty || creando} guardando={isSubmitting} etiqueta={creando ? "Crear insumo" : "Guardar cambios"} />
    </form>
  );
}
