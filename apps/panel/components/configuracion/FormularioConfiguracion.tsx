"use client";

import { DIAS_SEMANA, NOMBRE_DIA, configuracionSchema, type Configuracion } from "@jyl/core";
import { useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useProtegerCambios } from "@/components/cambios/CambiosSinGuardar";
import { BarraGuardar } from "@/components/formularios/BarraGuardar";
import { Campo, claseEntrada } from "@/components/formularios/Campo";
import { aplicarErroresDelServidor, enviarJson, numeroONulo } from "@/components/formularios/enviar";
import { Seccion } from "@/components/formularios/Seccion";

export function FormularioConfiguracion({ inicial }: { inicial: Configuracion }) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<Configuracion>({
    resolver: zodResolver(configuracionSchema),
    defaultValues: inicial,
    mode: "onTouched",
  });
  const { register, handleSubmit, reset, setError, watch, formState } = form;
  const { errors, isDirty, isSubmitting } = formState;

  async function guardar(): Promise<boolean> {
    let ok = false;
    await handleSubmit(async (datos) => {
      const resultado = await enviarJson("/api/configuracion", "PUT", datos);
      if (!resultado.ok) {
        aplicarErroresDelServidor(resultado.campos, setError);
        toast({ title: "No se guardó la configuración", description: resultado.error, variant: "error" });
        return;
      }
      // Se toma como nuevo punto de partida lo que quedó guardado, ya
      // normalizado (el WhatsApp, por ejemplo, vuelve con el 57 delante).
      reset(configuracionSchema.parse(datos));
      toast({ title: "Configuración guardada", variant: "success" });
      router.refresh();
      ok = true;
    })();
    return ok;
  }

  useProtegerCambios(isDirty, guardar);

  const lat = watch("direccion.lat");
  const lng = watch("direccion.lng");
  const hayPunto = typeof lat === "number" && typeof lng === "number";

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        void guardar();
      }}
      className="flex flex-col gap-10 pb-28"
    >
      <Seccion
        titulo="Contacto"
        descripcion="Aparece en el sitio público y en el botón de WhatsApp."
      >
        <div className="grid gap-4 sm:grid-cols-3">
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
      </Seccion>

      <Seccion
        titulo="Ubicación"
        descripcion="La dirección se muestra en contacto; las coordenadas ponen el punto en el mapa."
      >
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
      </Seccion>

      <Seccion titulo="Horarios" descripcion="Un día sin horas ni marca de cerrado no se muestra.">
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
      </Seccion>

      <Seccion titulo="Redes" descripcion="Enlace completo al perfil. Las que queden vacías no se muestran.">
        <div className="grid gap-4 sm:grid-cols-3">
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
      </Seccion>

      <Seccion
        titulo="Facturación"
        descripcion="Los datos del emisor salen en cada factura. El impuesto se aplica al emitirla."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo etiqueta="Razón social" error={errors.emisor?.razonSocial?.message}>
            {(p) => <input {...p} {...register("emisor.razonSocial")} className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="NIT" error={errors.emisor?.nit?.message}>
            {(p) => <input {...p} {...register("emisor.nit")} className={claseEntrada} />}
          </Campo>
          <Campo etiqueta="Impuesto (%)" error={errors.impuestoPorcentaje?.message}>
            {(p) => (
              <input
                {...p}
                {...register("impuestoPorcentaje", { setValueAs: numeroONulo })}
                inputMode="decimal"
                className={claseEntrada}
              />
            )}
          </Campo>
          <Campo etiqueta="Dirección del emisor" error={errors.emisor?.direccion?.message} className="sm:col-span-3">
            {(p) => <input {...p} {...register("emisor.direccion")} className={claseEntrada} />}
          </Campo>
        </div>
      </Seccion>

      <BarraGuardar visible={isDirty} guardando={isSubmitting} />
    </form>
  );
}

