"use client";

import { DIAS_SEMANA, NOMBRE_DIA, type Configuracion } from "@jyl/core";
import { Modal } from "@jyl/ui";
import { useState, type ReactNode } from "react";
import { BLOQUES, FormularioConfiguracion, type BloqueConfiguracion } from "./FormularioConfiguracion";

/**
 * Configuración vista de un vistazo — SPEC.md §6.8.
 *
 * Cinco bloques en lectura: lo que hay puesto, lo que falta y qué pasa por
 * faltar. Cada uno se edita solo, en un modal. Es más fácil saber qué queda
 * por hacer mirando una página que recorriendo un formulario entero, y
 * cambiar el teléfono no obliga a pasar por la tabla de horarios.
 */

const SIN_CONFIGURAR = <span className="text-ink-subtle">Sin configurar</span>;

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 py-1 text-sm">
      <dt className="w-28 shrink-0 text-ink-muted">{etiqueta}</dt>
      <dd className="min-w-0 break-words text-ink">{children || SIN_CONFIGURAR}</dd>
    </div>
  );
}

function Bloque({
  bloque,
  aviso,
  onEditar,
  children,
}: {
  bloque: BloqueConfiguracion;
  /** Qué deja de funcionar mientras falte algo; null si está completo. */
  aviso: string | null;
  onEditar: () => void;
  children: ReactNode;
}) {
  const { titulo, descripcion } = BLOQUES[bloque];
  return (
    <section aria-labelledby={`bloque-${bloque}`} className="flex flex-col rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id={`bloque-${bloque}`} className="font-display text-base text-ink">
            {titulo}
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">{descripcion}</p>
        </div>
        <button
          type="button"
          onClick={onEditar}
          aria-label={`Editar ${titulo.toLowerCase()}`}
          className="shrink-0 rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Editar
        </button>
      </div>

      {/* El aviso dice la consecuencia, no solo «falta»: a quien administra
          le importa qué deja de verse o de funcionar. */}
      {/* Texto en tinta y no en `warning`: ese ocre sobre su fondo suave
          da ≈3,3:1, por debajo del AA (AGENTS.md §11). El color del aviso
          lo llevan el fondo y el borde. */}
      {aviso && (
        <p className="mt-3 rounded-md border-l-2 border-warning bg-warning-soft px-3 py-2 text-sm text-ink">{aviso}</p>
      )}

      <dl className="mt-3">{children}</dl>
    </section>
  );
}

export function ResumenConfiguracion({ configuracion: c }: { configuracion: Configuracion }) {
  const [abierto, setAbierto] = useState<BloqueConfiguracion | null>(null);
  // El título se conserva mientras el modal se anima al cerrarse.
  const [ultimo, setUltimo] = useState<BloqueConfiguracion>("contacto");
  const [sucio, setSucio] = useState(false);

  const editar = (bloque: BloqueConfiguracion) => {
    setUltimo(bloque);
    setAbierto(bloque);
  };
  const cerrar = () => setAbierto(null);

  const redes = (["instagram", "facebook", "tiktok"] as const).filter((red) => c.redes[red]);
  const hayHorarios = c.horarios.some((h) => h.cerrado || (h.abre && h.cierra));
  const hayPunto = c.direccion.lat !== null && c.direccion.lng !== null;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <Bloque
          bloque="contacto"
          aviso={c.whatsapp ? null : "Sin WhatsApp, el sitio no muestra su botón ni el enlace para escribir."}
          onEditar={() => editar("contacto")}
        >
          <Dato etiqueta="WhatsApp">{c.whatsapp}</Dato>
          <Dato etiqueta="Teléfono">{c.telefono}</Dato>
          <Dato etiqueta="Correo">{c.email}</Dato>
        </Bloque>

        <Bloque
          bloque="facturacion"
          aviso={
            c.emisor.razonSocial && c.emisor.nit && c.impuestoPorcentaje !== null
              ? null
              : "Sin razón social, NIT e impuesto no se puede emitir ninguna factura."
          }
          onEditar={() => editar("facturacion")}
        >
          <Dato etiqueta="Razón social">{c.emisor.razonSocial}</Dato>
          <Dato etiqueta="NIT">{c.emisor.nit}</Dato>
          <Dato etiqueta="Impuesto">{c.impuestoPorcentaje === null ? "" : `${c.impuestoPorcentaje} %`}</Dato>
          <Dato etiqueta="Dirección">{c.emisor.direccion}</Dato>
        </Bloque>

        <Bloque
          bloque="ubicacion"
          aviso={hayPunto ? null : "Sin coordenadas, el sitio no muestra el mapa."}
          onEditar={() => editar("ubicacion")}
        >
          <Dato etiqueta="Dirección">{c.direccion.linea}</Dato>
          <Dato etiqueta="Barrio">{c.direccion.barrio}</Dato>
          <Dato etiqueta="Ciudad">{c.direccion.ciudad}</Dato>
          <Dato etiqueta="Referencia">{c.direccion.referencia}</Dato>
          <Dato etiqueta="En el mapa">{hayPunto ? "Punto puesto" : ""}</Dato>
        </Bloque>

        <Bloque
          bloque="horarios"
          aviso={hayHorarios ? null : "Sin horarios, el sitio no puede decir si está abierto."}
          onEditar={() => editar("horarios")}
        >
          {DIAS_SEMANA.map((dia) => {
            const h = c.horarios.find((x) => x.dia === dia);
            const franja = !h ? "" : h.cerrado ? "Cerrado" : h.abre && h.cierra ? `${h.abre} – ${h.cierra}` : "";
            return (
              <Dato key={dia} etiqueta={NOMBRE_DIA[dia]}>
                <span className="tabular-nums">{franja}</span>
              </Dato>
            );
          })}
        </Bloque>

        <Bloque bloque="redes" aviso={null} onEditar={() => editar("redes")}>
          {redes.length > 0 ? (
            redes.map((red) => (
              <Dato key={red} etiqueta={{ instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" }[red]}>
                {c.redes[red]}
              </Dato>
            ))
          ) : (
            <p className="py-1 text-sm text-ink-subtle">Ninguna. Son opcionales.</p>
          )}
        </Bloque>
      </div>

      <Modal
        open={abierto !== null}
        onOpenChange={(siguiente) => {
          if (!siguiente) cerrar();
        }}
        size="lg"
        closeOnOutsideClick={!sucio}
      >
        {/* Scroll propio con tope de alto: la tabla de horarios no cabe en
            un móvil y el pie con los botones quedaría fuera de la pantalla. */}
        <div className="flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Modal.Title className="font-display text-xl text-ink">{BLOQUES[ultimo].titulo}</Modal.Title>
              <Modal.Description className="mt-1 text-sm text-ink-muted">{BLOQUES[ultimo].descripcion}</Modal.Description>
            </div>
            <Modal.Close aria-label="Cerrar" className="text-ink-subtle transition-colors hover:text-ink">
              ✕
            </Modal.Close>
          </div>

          {/* Solo montado mientras está abierto: cada apertura parte de lo
              guardado, no de lo que quedó a medias la vez anterior. */}
          {abierto && (
            <FormularioConfiguracion
              key={abierto}
              inicial={c}
              bloque={abierto}
              onListo={cerrar}
              onCancelar={cerrar}
              onCambios={setSucio}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
