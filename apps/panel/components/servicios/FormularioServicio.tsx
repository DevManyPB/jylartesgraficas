"use client";

import {
  CATEGORIAS_SERVICIO,
  NOMBRE_CATEGORIA,
  servicioEditableSchema,
  type ServicioEditable,
} from "@jyl/core";
import { useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useProtegerCambios } from "@/components/cambios/CambiosSinGuardar";
import { BarraGuardar } from "@/components/formularios/BarraGuardar";
import { Campo, Casilla, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson, numeroONulo } from "@/components/formularios/enviar";
import { Seccion } from "@/components/formularios/Seccion";

interface FormularioServicioProps {
  /** Sin id se crea uno nuevo. */
  id?: string;
  inicial: ServicioEditable;
}

export function FormularioServicio({ id, inicial }: FormularioServicioProps) {
  const { toast } = useToast();
  const router = useRouter();
  const creando = id === undefined;

  const { register, handleSubmit, reset, setError, watch, formState } = useForm<ServicioEditable>({
    resolver: zodResolver(servicioEditableSchema),
    defaultValues: inicial,
    mode: "onTouched",
  });
  const { errors, isDirty, isSubmitting } = formState;

  async function guardar(): Promise<boolean> {
    let ok = false;
    await handleSubmit(async (datos) => {
      const resultado = await enviarJson<{ id?: string }>(
        creando ? "/api/servicios" : `/api/servicios/${id}`,
        creando ? "POST" : "PUT",
        datos,
      );

      if (!resultado.ok) {
        aplicarErroresDelServidor(resultado.campos, setError);
        toast({ title: "No se guardó el servicio", description: resultado.error, variant: "error" });
        return;
      }

      reset(datos);
      ok = true;
      toast({ title: creando ? "Servicio creado" : "Servicio guardado", variant: "success" });

      // Al crear se pasa a la página del servicio nuevo, que ya tiene id.
      if (creando && resultado.datos.id) router.replace(`/servicios/${resultado.datos.id}`);
      else router.refresh();
    })();
    return ok;
  }

  useProtegerCambios(isDirty, guardar);

  const descripcion = watch("descripcion") ?? "";

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        void guardar();
      }}
      className="flex flex-col gap-10 pb-28"
    >
      <Seccion titulo="Qué es">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" error={errors.nombre?.message}>
            {(p) => <input {...p} {...register("nombre")} autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Categoría" error={errors.categoria?.message}>
            {(p) => (
              <select {...p} {...register("categoria")} className={claseEntrada}>
                {CATEGORIAS_SERVICIO.map((c) => (
                  <option key={c} value={c}>
                    {NOMBRE_CATEGORIA[c]}
                  </option>
                ))}
              </select>
            )}
          </Campo>
          <Campo
            etiqueta="Descripción"
            ayuda={`Lo que ve el cliente en la página de servicios. ${descripcion.length}/600`}
            error={errors.descripcion?.message}
            className="sm:col-span-2"
          >
            {(p) => <textarea {...p} {...register("descripcion")} rows={4} className={claseEntrada} />}
          </Campo>
          <Campo
            etiqueta="Precio desde (COP)"
            ayuda="Déjalo vacío si se cotiza caso a caso: no se mostrará ninguna cifra."
            error={errors.precioBase?.message}
          >
            {(p) => (
              <input
                {...p}
                {...register("precioBase", { setValueAs: numeroONulo })}
                inputMode="numeric"
                className={claseEntrada}
              />
            )}
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="En el formulario de pedido" descripcion="Qué se le pide al cliente al elegir este servicio.">
        <div className="flex flex-col gap-3">
          <Casilla etiqueta="Pide medidas y material" ayuda="Para impresos: tamaño del afiche, del pendón…">
            {({ id: idCasilla }) => (
              <input id={idCasilla} type="checkbox" {...register("requiereMedidas")} className="mt-0.5 h-4 w-4 accent-accent" />
            )}
          </Casilla>
          <Casilla etiqueta="Sugiere adjuntar referencias" ayuda="Bocetos, logos o ejemplos.">
            {({ id: idCasilla }) => (
              <input id={idCasilla} type="checkbox" {...register("requiereReferencias")} className="mt-0.5 h-4 w-4 accent-accent" />
            )}
          </Casilla>
        </div>
      </Seccion>

      <Seccion
        titulo="Visibilidad"
        descripcion="Un servicio oculto no aparece en el sitio ni en el formulario de pedido. Los pedidos que ya lo usan no cambian."
      >
        <Casilla etiqueta="Visible en el sitio">
          {({ id: idCasilla }) => (
            <input id={idCasilla} type="checkbox" {...register("activo")} className="mt-0.5 h-4 w-4 accent-accent" />
          )}
        </Casilla>
      </Seccion>

      <BarraGuardar
        visible={isDirty || creando}
        guardando={isSubmitting}
        etiqueta={creando ? "Crear servicio" : "Guardar cambios"}
      />
    </form>
  );
}
