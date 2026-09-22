"use client";

import { DIAS_SEMANA, NOMBRE_DIA, configuracionSchema, type Configuracion } from "@jyl/core";
import { useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { Campo, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson, numeroONulo } from "@/components/formularios/enviar";

export type BloqueConfiguracion = "contacto" | "ubicacion" | "horarios" | "redes" | "facturacion";

/**
 * Los cinco bloques de Configuración y qué claves del esquema son de cada
 * uno. Entre todos cubren todas las claves de `configuracionSchema`: si
 * alguna se añade al esquema, tiene que caer en un bloque o no habrá dónde
 * editarla.
 */
export const BLOQUES: Record<
  BloqueConfiguracion,
  { titulo: string; descripcion: string; claves: readonly (keyof Configuracion)[] }
> = {
  contacto: {
    titulo: "Contacto",
    descripcion: "Aparece en el sitio público y en el botón de WhatsApp.",
    claves: ["whatsapp", "telefono", "email"],
  },
  ubicacion: {
    titulo: "Ubicación",
    descripcion: "La dirección se muestra en Contacto; las coordenadas ponen el punto en el mapa.",
    claves: ["direccion"],
  },
  horarios: {
    titulo: "Horarios",
    descripcion: "Un día sin horas ni marca de cerrado no se muestra.",
    claves: ["horarios"],
  },
  redes: {
    titulo: "Redes",
    descripcion: "Enlace completo al perfil. Las que queden vacías no se muestran.",
    claves: ["redes"],
  },
  facturacion: {
    titulo: "Facturación",
    descripcion: "Los datos del emisor salen en cada factura. El impuesto se aplica al emitirla.",
    claves: ["emisor", "impuestoPorcentaje"],
  },
};

const bloqueDe = (clave: string) =>
  (Object.keys(BLOQUES) as BloqueConfiguracion[]).find((b) => (BLOQUES[b].claves as readonly string[]).includes(clave));

interface FormularioConfiguracionProps {
  inicial: Configuracion;
  bloque: BloqueConfiguracion;
  onListo: () => void;
  onCancelar: () => void;
  /** Para que el modal sepa si hay algo a medio escribir antes de cerrarse. */
  onCambios: (sucio: boolean) => void;
}

/**
 * Un bloque de Configuración, dentro de su modal.
 *
 * Antes era un único formulario de cinco secciones con una sola barra de
 * guardar: la página más larga del panel, y para cambiar el teléfono había
 * que pasar por delante de la tabla de horarios. Ahora cada bloque se edita
 * solo, desde el resumen.
 *
 * Sin cambios de API: el formulario lleva la configuración entera como
 * valores iniciales, pinta solo los campos de su bloque y guarda con el
 * mismo PUT de siempre. Los campos que no pinta viajan con lo que ya estaba
 * guardado, así que tocar un bloque no cambia los otros.
 */
export function FormularioConfiguracion({ inicial, bloque, onListo, onCancelar, onCambios }: FormularioConfiguracionProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<Configuracion>({
    resolver: zodResolver(configuracionSchema),
    defaultValues: inicial,
    mode: "onTouched",
  });
  const { register, handleSubmit, setError, watch, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;

  useEffect(() => {
    onCambios(isDirty);
  }, [isDirty, onCambios]);

  async function guardar(datos: Configuracion) {
    const resultado = await enviarJson("/api/configuracion", "PUT", datos);
    if (!resultado.ok) {
      aplicarErroresDelServidor(resultado.campos, setError);
      toast({ title: "No se guardó la configuración", description: resultado.error, variant: "error" });
      return;
    }
    toast({ title: `${BLOQUES[bloque].titulo} guardado`, variant: "success" });
    // La página de detrás se recarga con lo guardado y el resumen se pone
    // al día sin que nadie tenga que refrescar.
    router.refresh();
    onListo();
  }

  /**
   * Si lo que falla es un campo de otro bloque —algo guardado antes de que
   * el esquema se volviera más estricto—, su error no se vería aquí, y el
   * botón parecería no hacer nada. Se dice dónde está.
   */
  function sinGuardar(errores: FieldErrors<Configuracion>) {
    const ajenos = [
      ...new Set(
        Object.keys(errores)
          .map(bloqueDe)
          .filter((b): b is BloqueConfiguracion => b !== undefined && b !== bloque),
      ),
    ];
    if (ajenos.length > 0) {
      toast({
        title: "Hay un dato por corregir en otro bloque",
        description: `Revisa ${ajenos.map((b) => `«${BLOQUES[b].titulo}»`).join(" y ")} y vuelve a intentarlo.`,
        variant: "error",
      });
    }
  }

  const lat = watch("direccion.lat");
  const lng = watch("direccion.lng");
  const hayPunto = typeof lat === "number" && typeof lng === "number";

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        void handleSubmit(guardar, sinGuardar)();
      }}
      className="flex flex-col gap-6"
    >
      {bloque === "contacto" && (
        <div className="grid gap-4">
          <Campo
            etiqueta="WhatsApp"
            ayuda="Con o sin +57; se guarda en el formato que pide WhatsApp."
            error={errors.whatsapp?.message}
          >
            {(p) => <input {...p} {...register("whatsapp")} type="tel" inputMode="tel" autoComplete="off" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Teléfono" error={errors.telefono?.message}>
            {(p) => <input {...p} {...register("telefono")} type="tel" inputMode="tel" className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Correo" error={errors.email?.message}>
            {(p) => <input {...p} {...register("email")} type="email" inputMode="email" className={claseEntrada} />}
          </Campo>
        </div>
      )}

      {bloque === "ubicacion" && (
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Dirección" error={errors.direccion?.linea?.message} className="sm:col-span-2">
              {(p) => <input {...p} {...register("direccion.linea")} autoComplete="off" className={claseEntrada} />}
            </Campo>
            <Campo etiqueta="Barrio" error={errors.direccion?.barrio?.message}>
              {(p) => <input {...p} {...register("direccion.barrio")} className={claseEntrada} />}
            </Campo>
            <Campo etiqueta="Ciudad" error={errors.direccion?.ciudad?.message}>
              {(p) => <input {...p} {...register("direccion.ciudad")} className={claseEntrada} />}
            </Campo>
            <Campo
              etiqueta="Referencia"
              ayuda="Cómo reconocer el local al llegar."
              error={errors.direccion?.referencia?.message}
              className="sm:col-span-2"
            >
              {(p) => <input {...p} {...register("direccion.referencia")} className={claseEntrada} />}
            </Campo>
            <Campo
              etiqueta="Latitud"
              ayuda="En Google Maps, clic derecho sobre el local: el primer número."
              error={errors.direccion?.lat?.message}
            >
              {(p) => (
                <input {...p} {...register("direccion.lat", { setValueAs: numeroONulo })} inputMode="decimal" className={claseEntrada} />
              )}
            </Campo>
            <Campo
              etiqueta="Longitud"
              ayuda="El segundo número, con el signo menos."
              error={errors.direccion?.lng?.message ?? errors.direccion?.root?.message}
            >
              {(p) => (
                <input {...p} {...register("direccion.lng", { setValueAs: numeroONulo })} inputMode="decimal" className={claseEntrada} />
              )}
            </Campo>
          </div>
          {hayPunto && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-block text-sm text-accent underline-offset-2 hover:underline"
            >
              Ver el punto en el mapa (se abre en otra pestaña)
            </a>
          )}
        </div>
      )}

      {bloque === "horarios" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[26rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-muted">
                <th scope="col" className="pb-2 font-medium">Día</th>
                <th scope="col" className="pb-2 font-medium">Abre</th>
                <th scope="col" className="pb-2 font-medium">Cierra</th>
                <th scope="col" className="pb-2 font-medium">Cerrado</th>
              </tr>
            </thead>
            <tbody>
              {DIAS_SEMANA.map((dia, i) => {
                const cerrado = watch(`horarios.${i}.cerrado`);
                const error = errors.horarios?.[i]?.abre?.message ?? errors.horarios?.[i]?.cierra?.message;
                return (
                  <tr key={dia} className="border-t border-border align-top">
                    <th scope="row" className="py-2 pr-3 text-left font-normal text-ink">
                      {NOMBRE_DIA[dia]}
                      {error && (
                        <span role="alert" className="block text-xs text-danger">
                          {error}
                        </span>
                      )}
                    </th>
                    <td className="py-2 pr-3">
                      <input
                        type="time"
                        aria-label={`${NOMBRE_DIA[dia]}: abre`}
                        aria-invalid={Boolean(errors.horarios?.[i]?.abre)}
                        disabled={cerrado}
                        {...register(`horarios.${i}.abre`)}
                        className={claseEntrada}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="time"
                        aria-label={`${NOMBRE_DIA[dia]}: cierra`}
                        aria-invalid={Boolean(errors.horarios?.[i]?.cierra)}
                        disabled={cerrado}
                        {...register(`horarios.${i}.cierra`)}
                        className={claseEntrada}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="checkbox"
                        aria-label={`${NOMBRE_DIA[dia]}: cerrado`}
                        {...register(`horarios.${i}.cerrado`)}
                        className="mt-2 h-4 w-4 accent-accent"
                      />
                      <input type="hidden" {...register(`horarios.${i}.dia`)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {bloque === "redes" && (
        <div className="grid gap-4">
          {(["instagram", "facebook", "tiktok"] as const).map((red) => (
            <Campo
              key={red}
              etiqueta={{ instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" }[red]}
              error={errors.redes?.[red]?.message}
            >
              {(p) => <input {...p} {...register(`redes.${red}`)} type="url" inputMode="url" placeholder="https://" className={claseEntrada} />}
            </Campo>
          ))}
        </div>
      )}

      {bloque === "facturacion" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Razón social" error={errors.emisor?.razonSocial?.message} className="sm:col-span-2">
            {(p) => <input {...p} {...register("emisor.razonSocial")} className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="NIT" error={errors.emisor?.nit?.message}>
            {(p) => <input {...p} {...register("emisor.nit")} className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Impuesto (%)" ayuda="Pon 0 si no aplica." error={errors.impuestoPorcentaje?.message}>
            {(p) => (
              <input
                {...p}
                {...register("impuestoPorcentaje", { setValueAs: numeroONulo })}
                inputMode="decimal"
                className={claseEntrada}
              />
            )}
          </Campo>
          <Campo etiqueta="Dirección del emisor" error={errors.emisor?.direccion?.message} className="sm:col-span-2">
            {(p) => <input {...p} {...register("emisor.direccion")} className={claseEntrada} />}
          </Campo>
        </div>
      )}

      {/* Cancelar a la izquierda, como en todos los modales (SPEC.md §5.2). */}
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
          {isSubmitting ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
