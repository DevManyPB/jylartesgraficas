"use client";

import { MAX_IMAGENES_PROYECTO, proyectoEditableSchema, type ProyectoEditable } from "@jyl/core";
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

type DatosProyecto = Omit<ProyectoEditable, "imagenes"> & { imagenes: ImagenEnEdicion[] };

interface FormularioProyectoProps {
  id?: string;
  inicial: DatosProyecto;
  categorias: string[];
}

/** Un proyecto del portafolio — SPEC.md §6.7. */
export function FormularioProyecto({ id, inicial, categorias }: FormularioProyectoProps) {
  const { toast } = useToast();
  const router = useRouter();
  const idLista = useId();
  const creando = id === undefined;
  const [eliminando, setEliminando] = useState(false);

  const { register, handleSubmit, reset, setError, control, getValues, formState } = useForm<DatosProyecto>({
    resolver: zodResolver(proyectoEditableSchema) as unknown as Resolver<DatosProyecto>,
    defaultValues: inicial,
    mode: "onTouched",
  });
  const { errors, isDirty, isSubmitting } = formState;

  async function guardar(): Promise<boolean> {
    let ok = false;
    await handleSubmit(async (datos) => {
      const r = await enviarJson<{ id?: string }>(
        creando ? "/api/portafolio" : `/api/portafolio/${id}`,
        creando ? "POST" : "PUT",
        proyectoEditableSchema.parse(datos),
      );
      if (!r.ok) {
        aplicarErroresDelServidor(r.campos, setError);
        toast({ title: "No se guardó el proyecto", description: r.error, variant: "error" });
        return;
      }
      // `datos` es la salida del esquema, que descarta la `url` de cada imagen:
      // se reinicia con lo que hay en pantalla para no perder las vistas previas.
      reset(getValues());
      ok = true;
      toast({ title: creando ? "Proyecto creado" : "Proyecto guardado", variant: "success" });
      if (creando && r.datos.id) router.replace(`/portafolio/${r.datos.id}`);
      else router.refresh();
    })();
    return ok;
  }

  useProtegerCambios(isDirty, guardar);
  const { guardarConfirmando, dialogo } = useConfirmarDespublicar(inicial.titulo, "el portafolio");

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        guardarConfirmando(!creando && inicial.publicado, getValues("publicado"), guardar);
      }}
      className="flex flex-col gap-10 pb-28"
    >
      <Seccion titulo="Proyecto">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Título" error={errors.titulo?.message}>
            {(p) => <input {...p} {...register("titulo")} autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Categoría" ayuda="Sirve para filtrar el portafolio." error={errors.categoria?.message}>
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
          <Campo etiqueta="Cliente" ayuda="Opcional. Déjalo vacío si el cliente prefiere no aparecer." error={errors.cliente?.message}>
            {(p) => <input {...p} {...register("cliente")} className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Descripción" ayuda="Qué se hizo y para qué. Breve." error={errors.descripcion?.message} className="sm:col-span-2">
            {(p) => <textarea {...p} {...register("descripcion")} rows={4} className={claseEntrada} />}
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Fotos" descripcion="Cada una se muestra en su proporción real, sin recortes. La primera es la portada.">
        <Controller
          control={control}
          name="imagenes"
          render={({ field }) => (
            <EditorImagenes
              destino="portafolio"
              imagenes={field.value}
              onChange={field.onChange}
              maximo={MAX_IMAGENES_PROYECTO}
              errores={field.value.map((_, i) => errors.imagenes?.[i]?.alt?.message)}
            />
          )}
        />
      </Seccion>

      <Seccion titulo="En el sitio">
        <div className="flex flex-col gap-3">
          <Casilla etiqueta="Destacado" ayuda="Aparece primero en el inicio.">
            {({ id: i }) => <input id={i} type="checkbox" {...register("destacado")} className="mt-0.5 h-4 w-4 accent-accent" />}
          </Casilla>
          <Casilla etiqueta="Publicado" ayuda="Sin marcar, queda guardado pero el público no lo ve.">
            {({ id: i }) => <input id={i} type="checkbox" {...register("publicado")} className="mt-0.5 h-4 w-4 accent-accent" />}
          </Casilla>
          {errors.publicado && (
            <p role="alert" className="text-xs text-danger">
              {errors.publicado.message}
            </p>
          )}
        </div>
      </Seccion>

      {!creando && (
        <Seccion titulo="Eliminar" descripcion="Para retirarlo del sitio basta con despublicarlo.">
          <button
            type="button"
            onClick={() => setEliminando(true)}
            className="rounded-md border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft"
          >
            Eliminar proyecto
          </button>
          <ConfirmDialog
            open={eliminando}
            onOpenChange={setEliminando}
            variant="destructive"
            title={`¿Eliminar «${inicial.titulo}»?`}
            description="Se borran el proyecto y sus fotos. No se puede deshacer."
            confirmLabel="Eliminar"
            confirmationRequirement={{ type: "phrase", phrase: inicial.titulo }}
            onConfirm={async () => {
              const r = await fetch(`/api/portafolio/${id}`, { method: "DELETE" });
              if (!r.ok) {
                toast({ title: "No se eliminó el proyecto", description: "Inténtalo de nuevo.", variant: "error" });
                throw new Error("no-eliminado");
              }
              reset(inicial);
              toast({ title: `«${inicial.titulo}» eliminado`, variant: "success" });
              router.replace("/portafolio");
            }}
          />
        </Seccion>
      )}

      {dialogo}
      <BarraGuardar visible={isDirty || creando} guardando={isSubmitting} etiqueta={creando ? "Crear proyecto" : "Guardar cambios"} />
    </form>
  );
}
