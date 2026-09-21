"use client";

import type { ServicioEditable } from "@jyl/core";
import { Modal } from "@jyl/ui";
import { useState } from "react";
import { FormularioServicio } from "./FormularioServicio";

const NUEVO: ServicioEditable = {
  nombre: "",
  categoria: "publicidad",
  descripcion: "",
  precioBase: null,
  activo: true,
  requiereMedidas: false,
  requiereReferencias: true,
};

export interface ServicioEnEdicion {
  id?: string;
  nombre: string;
  inicial: ServicioEditable;
}

export const SERVICIO_NUEVO: ServicioEnEdicion = { nombre: "Nuevo servicio", inicial: NUEVO };

/**
 * Crear o editar un servicio sin salir de la lista.
 *
 * Antes cada servicio se editaba en su propia página: pulsar, esperar la
 * carga, guardar y volver, para cuatro campos. Quien administra perdía el
 * sitio en el que estaba en cada edición. Ahora la lista se queda detrás y
 * el cambio aparece en la misma fila de la que se salió.
 *
 * El clic fuera no cierra si hay algo escrito a medias (SPEC.md §5.3): en un
 * formulario, cerrar sin querer es perder el trabajo. El aspa y Esc sí
 * cierran, porque ahí la intención es explícita.
 */
export function ServicioEnModal({
  servicio,
  onCerrar,
}: {
  /** null cuando no hay ninguno abierto. El modal sigue montado para que la
   *  animación de salida corra y el foco vuelva al botón que lo abrió. */
  servicio: ServicioEnEdicion | null;
  onCerrar: () => void;
}) {
  const [sucio, setSucio] = useState(false);

  return (
    <Modal
      open={servicio !== null}
      onOpenChange={(siguiente) => {
        if (!siguiente) onCerrar();
      }}
      size="lg"
      closeOnOutsideClick={!sucio}
    >
      {/* `max-h` con scroll propio: en un móvil este formulario no cabe
          entero, y sin esto el pie con los botones quedaría fuera de la
          pantalla, sin forma de llegar a él. */}
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <Modal.Title className="font-display text-xl text-ink">
            {servicio?.id ? servicio.nombre : "Nuevo servicio"}
          </Modal.Title>
          <Modal.Close aria-label="Cerrar" className="text-ink-subtle transition-colors hover:text-ink">
            ✕
          </Modal.Close>
        </div>
        <Modal.Description className="sr-only">
          Nombre, categoría, descripción, precio y visibilidad del servicio.
        </Modal.Description>

        {servicio && (
          <FormularioServicio
            // La key reinicia el formulario al pasar de un servicio a otro
            // sin desmontar el modal.
            key={servicio.id ?? "nuevo"}
            id={servicio.id}
            inicial={servicio.inicial}
            onListo={onCerrar}
            onCancelar={onCerrar}
            onCambios={setSucio}
          />
        )}
      </div>
    </Modal>
  );
}
