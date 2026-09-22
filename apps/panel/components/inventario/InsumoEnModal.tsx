"use client";

import type { InsumoEditable } from "@jyl/core";
import { Modal } from "@jyl/ui";
import { useState } from "react";
import { FormularioInsumo } from "./FormularioInsumo";

const NUEVO: InsumoEditable = {
  nombre: "",
  sku: "",
  unidad: "",
  stockMinimo: 0,
  costoUnitario: null,
  proveedor: "",
};

/**
 * Crear o editar un insumo sin cambiar de página — mismo patrón que
 * Servicios (`ServicioEnModal`).
 *
 * El detalle de un insumo sigue siendo una página, porque el stock y el
 * historial de movimientos son contenido que se consulta, no un formulario.
 * Lo que sale de ahí es el formulario largo que había al final: ahora es un
 * botón que abre este modal.
 *
 * El clic fuera no cierra si hay algo a medio escribir (SPEC.md §5.3).
 */
function InsumoEnModal({
  abierto,
  onCerrar,
  id,
  inicial,
}: {
  abierto: boolean;
  onCerrar: () => void;
  id?: string;
  inicial: InsumoEditable;
}) {
  const [sucio, setSucio] = useState(false);

  return (
    <Modal
      open={abierto}
      onOpenChange={(siguiente) => {
        if (!siguiente) onCerrar();
      }}
      size="lg"
      closeOnOutsideClick={!sucio}
    >
      {/* Scroll propio con tope de alto: en un móvil el formulario no cabe y
          el pie con los botones quedaría fuera de la pantalla. */}
      <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <Modal.Title className="font-display text-xl text-ink">
            {id ? `Editar ${inicial.nombre}` : "Nuevo insumo"}
          </Modal.Title>
          <Modal.Close aria-label="Cerrar" className="text-ink-subtle transition-colors hover:text-ink">
            ✕
          </Modal.Close>
        </div>
        <Modal.Description className="sr-only">
          Nombre, unidad, stock mínimo, costo, proveedor y referencia del insumo.
        </Modal.Description>

        {/* Solo se monta abierto: así cada apertura empieza de lo guardado y
            no de lo que quedó escrito a medias la vez anterior. */}
        {abierto && (
          <FormularioInsumo id={id} inicial={inicial} onListo={onCerrar} onCancelar={onCerrar} onCambios={setSucio} />
        )}
      </div>
    </Modal>
  );
}

const ESTILO_PRINCIPAL =
  "inline-flex rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const ESTILO_SECUNDARIO =
  "inline-flex rounded-md border border-border-strong px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

/** «Nuevo insumo»: en la cabecera de la lista y en su pantalla vacía. */
export function BotonNuevoInsumo({ etiqueta = "Nuevo insumo" }: { etiqueta?: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={ESTILO_PRINCIPAL}>
        {etiqueta}
      </button>
      <InsumoEnModal abierto={abierto} onCerrar={() => setAbierto(false)} inicial={NUEVO} />
    </>
  );
}

/** «Editar datos» en el detalle de un insumo. */
export function BotonEditarInsumo({ id, inicial }: { id: string; inicial: InsumoEditable }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)} className={ESTILO_SECUNDARIO}>
        Editar datos
      </button>
      <InsumoEnModal abierto={abierto} onCerrar={() => setAbierto(false)} id={id} inicial={inicial} />
    </>
  );
}
