"use client";

import { pedidoEntranteSchema, type Invitado, type PedidoEntrante, type Servicio } from "@jyl/core";
import { ConfirmDialog, useToast } from "@jyl/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Confirmacion } from "./Confirmacion";
import { PasoDatos } from "./PasoDatos";
import { PasoDetalles } from "./PasoDetalles";
import { PasoReferencias } from "./PasoReferencias";
import { PasoProducto, type ProductoElegido } from "./PasoProducto";
import { PasoServicio } from "./PasoServicio";
import { Progreso, TOTAL_PASOS } from "./Progreso";
import { useBorrador } from "./use-borrador";
import { useReferencias } from "./use-referencias";

interface FormularioPedidoProps {
  servicios: Servicio[];
  /** Con sesión: el contacto de la cuenta, para precargar el paso 4. */
  identidad: Invitado | null;
  /** Si se llegó desde la tienda, el producto y la variante ya elegidos. */
  producto?: ProductoElegido | null;
  /** Si se llegó desde /servicios, el servicio ya elegido. */
  servicioInicial?: string | null;
  /** WhatsApp del estudio, ya normalizado; null si no está configurado. */
  whatsapp?: string | null;
}

/**
 * Qué campos valida cada paso antes de dejar avanzar. El de referencias no
 * valida nada del formulario: los archivos viven fuera de react-hook-form
 * porque un `File` no es serializable y no puede ir al borrador.
 */
const CAMPOS_POR_PASO = [
  ["serviceId", "items"],
  ["detalle"],
  [],
  ["invitado", "aceptaTerminos"],
] as const;

interface PedidoEnviado {
  numero: string;
  archivosIncompletos: boolean;
}

export function FormularioPedido({
  servicios,
  identidad,
  producto = null,
  servicioInicial = null,
  whatsapp = null,
}: FormularioPedidoProps) {
  const [paso, setPaso] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [enviado, setEnviado] = useState<PedidoEnviado | null>(null);
  const { toast } = useToast();
  const { leer, guardar, limpiar } = useBorrador<PedidoEntrante>();
  const { referencias, agregar, quitar, publicIds, subiendo } = useReferencias();

  const form = useForm<PedidoEntrante>({
    resolver: zodResolver(pedidoEntranteSchema),
    mode: "onTouched",
    defaultValues: {
      tipo: producto ? "producto" : "servicio",
      serviceId: producto ? null : servicioInicial,
      items: producto ? [producto.item] : [],
      detalle: "",
      medidas: null,
      material: null,
      camposExtra: {},
      fechaDeseada: null,
      presupuestoAprox: null,
      archivos: [],
      invitado: identidad,
      aceptaTerminos: false,
    },
  });

  const { register, handleSubmit, watch, setValue, trigger, reset, formState } = form;
  const serviceId = watch("serviceId");
  const servicioElegido = servicios.find((s) => s.id === serviceId) ?? null;

  // El borrador se restaura tras montar, no durante el render: en el servidor
  // no hay localStorage y leerlo antes rompería la hidratación.
  useEffect(() => {
    const guardado = leer();
    if (!guardado) return;
    reset((actuales) => ({
      ...actuales,
      ...guardado,
      // Un borrador guardado antes del paso 4 trae `invitado: null`, que
      // borraría lo precargado de la cuenta. Y con cuenta, el correo es
      // siempre el suyo, aunque el borrador traiga otro.
      invitado: identidad
        ? { ...identidad, ...(guardado.invitado ?? {}), email: identidad.email }
        : (guardado.invitado ?? actuales.invitado),
      // Lo que se acaba de elegir en la tienda manda sobre un borrador viejo.
      ...(producto ? { tipo: "producto" as const, serviceId: null, items: [producto.item] } : {}),
    }));
  }, [leer, reset, identidad, producto]);

  // Se guarda en cada cambio. `archivos` queda fuera: son identificadores de
  // una subida concreta y restaurarlos días después adjuntaría lo que no es.
  useEffect(() => {
    const suscripcion = watch((valores) => {
      const borrador = { ...valores } as Partial<PedidoEntrante>;
      delete borrador.archivos;
      guardar(borrador);
    });
    return () => suscripcion.unsubscribe();
  }, [watch, guardar]);

  async function siguiente() {
    const campos = CAMPOS_POR_PASO[paso] ?? [];
    const valido = campos.length === 0 || (await trigger(campos as never, { shouldFocus: true }));
    if (valido) setPaso((p) => Math.min(p + 1, TOTAL_PASOS - 1));
  }

  async function enviar(datos: PedidoEntrante) {
    const respuesta = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Los identificadores los pone el hook de subidas, no el formulario: solo
      // llegan aquí los que Cloudinary ya confirmó.
      body: JSON.stringify({ ...datos, archivos: publicIds }),
    });

    if (!respuesta.ok) {
      const cuerpo = (await respuesta.json().catch(() => null)) as { error?: string } | null;
      toast({
        title: "No pudimos enviar el pedido",
        description: cuerpo?.error ?? "Revisa tu conexión e inténtalo de nuevo.",
        variant: "error",
      });
      throw new Error("envio");
    }

    const pedido = (await respuesta.json()) as PedidoEnviado;
    limpiar();
    setEnviado(pedido);
  }

  if (enviado) {
    return (
      <Confirmacion
        numero={enviado.numero}
        archivosIncompletos={enviado.archivosIncompletos}
        whatsapp={
          whatsapp
            ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hola, acabo de enviar el pedido ${enviado.numero}.`)}`
            : null
        }
      />
    );
  }

  return (
    <>
      <Progreso actual={paso} />

      <form
        className="mt-8"
        onSubmit={(evento) => {
          // El envío real ocurre tras confirmar en el modal (SPEC.md §5.1).
          evento.preventDefault();
        }}
      >
        {paso === 0 && producto && <PasoProducto producto={producto} />}

        {paso === 0 && !producto && (
          <PasoServicio
            servicios={servicios}
            seleccionado={serviceId}
            onSeleccionar={(id) => setValue("serviceId", id, { shouldValidate: true })}
            error={formState.errors.serviceId?.message}
          />
        )}

        {paso === 1 && (
          <PasoDetalles
            servicio={servicioElegido}
            producto={producto?.item.nombre ?? null}
            register={register}
            errors={formState.errors}
          />
        )}

        {paso === 2 && (
          <PasoReferencias
            referencias={referencias}
            onAgregar={agregar}
            onQuitar={quitar}
            sugerir={producto ? producto.item.personalizado : (servicioElegido?.requiereReferencias ?? true)}
          />
        )}

        {paso === 3 && (
          <PasoDatos identidad={identidad} register={register} errors={formState.errors} />
        )}

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6">
          <button
            type="button"
            onClick={() => setPaso((p) => Math.max(p - 1, 0))}
            disabled={paso === 0}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-canvas-sunken disabled:invisible"
          >
            Atrás
          </button>

          {paso < TOTAL_PASOS - 1 ? (
            <button
              type="button"
              onClick={siguiente}
              disabled={subiendo}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(() => setConfirmando(true))}
              disabled={subiendo}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-50"
            >
              Enviar pedido
            </button>
          )}
        </div>

        {subiendo && (
          <p role="status" className="mt-3 text-sm text-ink-muted">
            Esperando a que terminen de subir tus archivos…
          </p>
        )}
      </form>

      <ConfirmDialog
        open={confirmando}
        onOpenChange={setConfirmando}
        title="¿Enviar este pedido?"
        description="Lo revisaremos y te escribiremos con la cotización. Podrás seguirlo con el número que te daremos."
        confirmLabel="Enviar pedido"
        extra={
          <div className="rounded-lg border border-border bg-canvas-sunken p-4 text-sm">
            <p className="font-medium text-ink">
              {producto
                ? `${producto.item.cantidad} × ${producto.item.nombre}`
                : servicioElegido?.nombre}
            </p>
            <p className="mt-1 line-clamp-3 text-ink-muted">{watch("detalle")}</p>
            {publicIds.length > 0 && (
              <p className="mt-2 text-ink-muted">
                {publicIds.length === 1
                  ? "1 archivo adjunto"
                  : `${publicIds.length} archivos adjuntos`}
              </p>
            )}
          </div>
        }
        onConfirm={() => handleSubmit(enviar)()}
      />
    </>
  );
}
