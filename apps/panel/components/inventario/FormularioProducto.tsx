"use client";

import { MAX_IMAGENES_PRODUCTO, productoEditableSchema, type ProductoEditable } from "@jyl/core";
import { ConfirmDialog, useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { useProtegerCambios } from "@/components/cambios/CambiosSinGuardar";
import { BarraGuardar } from "@/components/formularios/BarraGuardar";
import { Campo, Casilla, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson } from "@/components/formularios/enviar";
import { Seccion } from "@/components/formularios/Seccion";
import { useConfirmarDespublicar } from "@/components/formularios/usar-confirmar-despublicar";
import { EditorImagenes, type ImagenEnEdicion } from "@/components/imagenes/EditorImagenes";

/** Lo mismo que se guarda, pero cada imagen lleva su URL para la vista previa. */
type FormularioProductoDatos = Omit<ProductoEditable, "imagenes"> & { imagenes: ImagenEnEdicion[] };

interface FormularioProductoProps {
  id?: string;
  inicial: FormularioProductoDatos;
  /** Categorías que ya existen, para sugerirlas y no terminar con "Camiseta" y "Camisetas". */
  categorias: string[];
}

export function FormularioProducto({ id, inicial, categorias }: FormularioProductoProps) {
  const { toast } = useToast();
  const router = useRouter();
  const idLista = useId();
  const creando = id === undefined;
  const [eliminando, setEliminando] = useState(false);

  const { register, handleSubmit, reset, setError, control, getValues, formState } = useForm<FormularioProductoDatos>({
    // El esquema descarta la `url` de cada imagen: al servidor solo va lo que guarda.
    resolver: zodResolver(productoEditableSchema) as unknown as Resolver<FormularioProductoDatos>,
    defaultValues: inicial,
    mode: "onTouched",
  });
  const { errors, isDirty, isSubmitting } = formState;

  async function guardar(): Promise<boolean> {
    let ok = false;
    await handleSubmit(async (datos) => {
      const cuerpo = productoEditableSchema.parse(datos);
      const resultado = await enviarJson<{ id?: string }>(
        creando ? "/api/productos" : `/api/productos/${id}`,
        creando ? "POST" : "PUT",
        cuerpo,
      );
      if (!resultado.ok) {
        aplicarErroresDelServidor(resultado.campos, setError);
        toast({ title: "No se guardó el producto", description: resultado.error, variant: "error" });
        return;
      }
      // `datos` es la salida del esquema, que descarta la `url` de cada imagen:
      // se reinicia con lo que hay en pantalla para no perder las vistas previas.
      reset(getValues());
      ok = true;
      toast({ title: creando ? "Producto creado" : "Producto guardado", variant: "success" });
      if (creando && resultado.datos.id) router.replace(`/inventario/productos/${resultado.datos.id}`);
      else router.refresh();
    })();
    return ok;
  }

  useProtegerCambios(isDirty, guardar);
  const { guardarConfirmando, dialogo } = useConfirmarDespublicar(inicial.nombre, "la tienda");

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        guardarConfirmando(!creando && inicial.activo, getValues("activo"), guardar);
      }}
      className="flex flex-col gap-10 pb-28"
    >
      <Seccion titulo="Producto">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" error={errors.nombre?.message}>
            {(p) => <input {...p} {...register("nombre")} autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Categoría" ayuda="Así se agrupa y se filtra en la tienda." error={errors.categoria?.message}>
            {(p) => (
              <>
                <input {...p} {...register("categoria")} list={idLista} autoComplete="off" className={claseEntrada} />
                <datalist id={idLista}>
                  {categorias.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}
          </Campo>
          <Campo etiqueta="Descripción" error={errors.descripcion?.message} className="sm:col-span-2">
            {(p) => <textarea {...p} {...register("descripcion")} rows={4} className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Proveedor" ayuda="Solo lo ve el estudio." error={errors.proveedor?.message}>
            {(p) => <input {...p} {...register("proveedor")} className={claseEntrada} />}
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Fotos" descripcion="La primera es la que aparece en la tienda.">
        <Controller
          control={control}
          name="imagenes"
          render={({ field }) => (
            <EditorImagenes
              destino="productos"
              imagenes={field.value}
              onChange={field.onChange}
              maximo={MAX_IMAGENES_PRODUCTO}
              errores={field.value.map((_, i) => errors.imagenes?.[i]?.alt?.message)}
            />
          )}
        />
      </Seccion>

      <Seccion titulo="En la tienda">
        <div className="flex flex-col gap-3">
          <Casilla etiqueta="Se puede personalizar" ayuda="Muestra la casilla «Quiero personalizarlo con mi diseño» (SPEC §4.4).">
            {({ id: i }) => <input id={i} type="checkbox" {...register("permitePersonalizacion")} className="mt-0.5 h-4 w-4 accent-accent" />}
          </Casilla>
          <Casilla etiqueta="Publicado en la tienda" ayuda="Sin marcar, el producto existe en el inventario pero el público no lo ve.">
            {({ id: i }) => <input id={i} type="checkbox" {...register("activo")} className="mt-0.5 h-4 w-4 accent-accent" />}
          </Casilla>
        </div>
      </Seccion>

      {!creando && (
        <Seccion titulo="Eliminar" descripcion="Para retirarlo de la tienda basta con despublicarlo.">
          <button
            type="button"
            onClick={() => setEliminando(true)}
            className="rounded-md border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            Eliminar producto
          </button>
          <ConfirmDialog
            open={eliminando}
            onOpenChange={setEliminando}
            variant="destructive"
            title={`¿Eliminar «${inicial.nombre}»?`}
            description="Se borran también sus variantes, su historial de movimientos y sus fotos. No se puede deshacer. Los pedidos que ya lo incluían conservan el nombre del producto."
            confirmLabel="Eliminar"
            confirmationRequirement={{ type: "phrase", phrase: inicial.nombre }}
            onConfirm={async () => {
              const r = await fetch(`/api/productos/${id}`, { method: "DELETE" });
              if (!r.ok) {
                toast({ title: "No se eliminó el producto", description: "Inténtalo de nuevo.", variant: "error" });
                throw new Error("no-eliminado");
              }
              reset(inicial); // Sin cambios pendientes: salir no debe preguntar.
              toast({ title: `«${inicial.nombre}» eliminado`, variant: "success" });
              router.replace("/inventario");
            }}
          />
        </Seccion>
      )}

      {dialogo}
      <BarraGuardar visible={isDirty || creando} guardando={isSubmitting} etiqueta={creando ? "Crear producto" : "Guardar cambios"} />
    </form>
  );
}
