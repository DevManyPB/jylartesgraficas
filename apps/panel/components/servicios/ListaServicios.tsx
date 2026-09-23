"use client";

import { CATEGORIAS_SERVICIO, NOMBRE_CATEGORIA, servicioEditableSchema, type ServicioDelPanel } from "@jyl/core";
import { cn, useToast } from "@jyl/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { enviarJson } from "@/components/formularios/enviar";
import { pesos } from "@/components/pedidos/formato";
import { SERVICIO_NUEVO, ServicioEnModal, type ServicioEnEdicion } from "./ServicioEnModal";

/**
 * Catálogo de servicios, agrupado como lo ve el público (SPEC.md §3.1).
 *
 * El orden se cambia con "Subir" y "Bajar" dentro de cada grupo: funcionan
 * igual con teclado que con ratón, y con una o dos docenas de servicios
 * arrastrar no ahorraría nada. El cambio se ve al instante y se deshace si
 * el servidor no lo acepta.
 */
export function ListaServicios({ servicios }: { servicios: ServicioDelPanel[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [orden, setOrden] = useState(servicios);
  const [moviendo, setMoviendo] = useState<string | null>(null);
  const [editando, setEditando] = useState<ServicioEnEdicion | null>(null);

  /** El esquema descarta lo que no se edita (id, orden), igual que el servidor. */
  const abrir = (servicio: ServicioDelPanel) =>
    setEditando({
      id: servicio.id,
      nombre: servicio.nombre,
      inicial: servicioEditableSchema.parse(servicio),
    });

  async function mover(id: string, direccion: -1 | 1) {
    // Sin `disabled` mientras se guarda: deshabilitar el botón con foco lo
    // manda al <body>, y con teclado se perdería el sitio en cada paso.
    if (moviendo) return;
    const categoria = orden.find((s) => s.id === id)?.categoria;
    const delGrupo = orden.filter((s) => s.categoria === categoria);
    const posicion = delGrupo.findIndex((s) => s.id === id);
    const vecino = delGrupo[posicion + direccion];
    if (!vecino) return;

    // Se intercambian en la lista global, que es la que guarda `orden`.
    const anterior = orden;
    const siguiente = [...orden];
    const a = siguiente.findIndex((s) => s.id === id);
    const b = siguiente.findIndex((s) => s.id === vecino.id);
    [siguiente[a], siguiente[b]] = [siguiente[b]!, siguiente[a]!];

    setOrden(siguiente);
    setMoviendo(id);

    // Si llegó al extremo, el botón pulsado desaparece con el foco dentro;
    // se pasa al botón contrario del mismo servicio para no perder el sitio.
    const llegoAlExtremo = direccion === -1 ? posicion === 1 : posicion === delGrupo.length - 2;
    if (llegoAlExtremo) {
      requestAnimationFrame(() =>
        document.getElementById(`${direccion === -1 ? "bajar" : "subir"}-${id}`)?.focus(),
      );
    }
    const resultado = await enviarJson("/api/servicios/orden", "PUT", { ids: siguiente.map((s) => s.id) });
    setMoviendo(null);

    if (!resultado.ok) {
      setOrden(anterior);
      toast({ title: "No se cambió el orden", description: resultado.error, variant: "error" });
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <button
          type="button"
          onClick={() => setEditando(SERVICIO_NUEVO)}
          className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-ink-inverted transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Nuevo servicio
        </button>
      </div>

      {orden.length === 0 && (
        <p className="text-sm text-ink-muted">Todavía no hay servicios. Crea el primero con el botón de arriba.</p>
      )}

      {CATEGORIAS_SERVICIO.map((categoria) => {
        const grupo = orden.filter((s) => s.categoria === categoria);
        if (grupo.length === 0) return null;

        return (
          <section key={categoria} aria-labelledby={`grupo-${categoria}`}>
            <h2 id={`grupo-${categoria}`} className="text-[13px] font-medium text-ink-muted">
              {NOMBRE_CATEGORIA[categoria]}
            </h2>

            <ul aria-busy={moviendo !== null} className="mt-2 divide-y divide-border border-y border-border">
              {grupo.map((servicio, i) => (
                <li key={servicio.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2">
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => abrir(servicio)}
                      className="text-left text-sm font-medium text-ink underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {servicio.nombre}
                      <span className="sr-only"> (editar)</span>
                    </button>
                    <p className="text-xs text-ink-muted">
                      {servicio.precioBase === null ? "Se cotiza" : `Desde ${pesos.format(servicio.precioBase)}`}
                      {servicio.descripcion === "" && (
                        <span className="text-warning-text"> · Sin descripción</span>
                      )}
                    </p>
                  </div>

                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs",
                      servicio.activo ? "bg-success-soft text-success" : "bg-canvas-sunken text-ink-muted",
                    )}
                  >
                    {servicio.activo ? "Visible" : "Oculto"}
                  </span>

                  <div className="flex gap-1">
                    <button
                      type="button"
                      id={`subir-${servicio.id}`}
                      onClick={() => mover(servicio.id, -1)}
                      disabled={i === 0}
                      data-extremo={i === 0 || undefined}
                      aria-label={`Subir ${servicio.nombre}`}
                      className="rounded px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink disabled:opacity-40 data-[extremo]:invisible"
                    >
                      Subir
                    </button>
                    <button
                      type="button"
                      id={`bajar-${servicio.id}`}
                      onClick={() => mover(servicio.id, 1)}
                      disabled={i === grupo.length - 1}
                      data-extremo={i === grupo.length - 1 || undefined}
                      aria-label={`Bajar ${servicio.nombre}`}
                      className="rounded px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink disabled:opacity-40 data-[extremo]:invisible"
                    >
                      Bajar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <ServicioEnModal servicio={editando} onCerrar={() => setEditando(null)} />
    </div>
  );
}
