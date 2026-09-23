"use client";

import { ESTADOS_PEDIDO, NOMBRE_ESTADO, type ColumnaDelTablero, type EstadoPedido, type FilaPedido } from "@jyl/core";
import { ConfirmDialog, cn, useToast } from "@jyl/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { enviarJson } from "@/components/formularios/enviar";
import { formatearFechaCorta } from "./formato";

interface TableroPedidosProps {
  columnas: ColumnaDelTablero[];
}

type Pendiente = { fila: FilaPedido; destino: EstadoPedido };

/**
 * Kanban por estado — SPEC.md §6.3. Se puede arrastrar una tarjeta a otra
 * columna, y cada tarjeta lleva además un selector «Mover a»: es la
 * alternativa por teclado que pide el SPEC, y de paso es lo que funciona en
 * el móvil, donde arrastrar entre columnas que no caben en pantalla es
 * incómodo.
 *
 * El cambio se ve al instante y se confirma contra el servidor; si falla, la
 * tarjeta vuelve a su columna y se dice por qué.
 */
export function TableroPedidos({ columnas }: TableroPedidosProps) {
  const { toast } = useToast();
  const router = useRouter();
  const idBase = useId();
  const [movidos, setMovidos] = useState<Record<string, EstadoPedido>>({});
  const [enVuelo, setEnVuelo] = useState<string[]>([]);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<EstadoPedido | null>(null);
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);

  const filas = columnas.flatMap((c) => c.filas);

  /**
   * Dónde se pintó la tarjeta tras moverla, mientras el servidor todavía la
   * manda en su columna anterior. En cuanto el servidor se pone al día, la
   * anotación coincide con lo que él dice y deja de contar sola.
   */
  const destinoDe = (fila: FilaPedido): EstadoPedido | null => {
    const destino = movidos[fila.id];
    return destino !== undefined && destino !== fila.estado ? destino : null;
  };

  const estadoDe = (fila: FilaPedido) => destinoDe(fila) ?? fila.estado;

  const porColumna = new Map<EstadoPedido, FilaPedido[]>(ESTADOS_PEDIDO.map((e) => [e, []]));
  for (const fila of filas) porColumna.get(estadoDe(fila))!.push(fila);

  /**
   * El total de la cabecera lo cuenta el servidor, así que mientras un
   * cambio va en camino hay que sumarle las tarjetas que acaban de entrar y
   * restarle las que salieron; si no, la cifra no cuadra con lo que se ve.
   */
  const totalDe = (estado: EstadoPedido) =>
    filas.reduce((cuenta, fila) => {
      const destino = destinoDe(fila);
      if (destino === null) return cuenta;
      if (destino === estado) return cuenta + 1;
      if (fila.estado === estado) return cuenta - 1;
      return cuenta;
    }, columnas.find((c) => c.estado === estado)?.total ?? 0);

  async function aplicar(fila: FilaPedido, destino: EstadoPedido) {
    const anterior = estadoDe(fila);
    if (destino === anterior) return;

    setMovidos((previos) => ({ ...previos, [fila.id]: destino }));
    setEnVuelo((previos) => [...previos, fila.id]);

    const resultado = await enviarJson(`/api/pedidos/${fila.id}/estado`, "PUT", { estado: destino, nota: "" });
    setEnVuelo((previos) => previos.filter((id) => id !== fila.id));

    if (!resultado.ok) {
      // Vuelve a su columna: se anota el estado que el servidor sigue teniendo.
      setMovidos((previos) => ({ ...previos, [fila.id]: anterior }));
      toast({ title: `${fila.numero} sigue en ${NOMBRE_ESTADO[anterior]}`, description: resultado.error, variant: "error" });
      router.refresh();
      // Lanzar mantiene abierto el modal de confirmación, si lo había.
      throw new Error("no-movido");
    }

    toast({ title: `${fila.numero}: ${NOMBRE_ESTADO[destino]}`, variant: "success" });
    router.refresh();
  }

  /** Entregado cierra el pedido, así que se confirma — SPEC.md §5.1. */
  function mover(fila: FilaPedido, destino: EstadoPedido) {
    if (destino === estadoDe(fila)) return;
    if (destino === "entregado") setPendiente({ fila, destino });
    else aplicar(fila, destino).catch(() => undefined);
  }

  return (
    <>
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <ul className="flex min-h-[60vh] gap-3">
          {ESTADOS_PEDIDO.map((estado) => {
            const columna = columnas.find((c) => c.estado === estado);
            const visibles = porColumna.get(estado)!;
            const ocultos = Math.max(0, (columna?.total ?? 0) - (columna?.filas.length ?? 0));

            return (
              <li
                key={estado}
                onDragOver={(e) => {
                  // Sin preventDefault el navegador no permite soltar aquí.
                  e.preventDefault();
                  setEncima(estado);
                }}
                onDragLeave={() => setEncima((actual) => (actual === estado ? null : actual))}
                onDrop={(e) => {
                  e.preventDefault();
                  setEncima(null);
                  // Si el navegador no manda `dragend` (pasa al soltar fuera
                  // de la tarjeta), el tablero se quedaría en modo arrastre.
                  setArrastrando(null);
                  const id = e.dataTransfer.getData("text/plain");
                  const fila = filas.find((f) => f.id === id);
                  if (fila) mover(fila, estado);
                }}
                className={cn(
                  "flex w-64 shrink-0 flex-col rounded-lg border p-2 transition-colors",
                  encima === estado && arrastrando ? "border-accent bg-accent-soft" : "border-border bg-canvas-sunken",
                )}
              >
                <h2 className="flex items-baseline justify-between gap-2 px-1 pb-2 text-[13px] font-medium text-ink">
                  {NOMBRE_ESTADO[estado]}
                  <span className="tabular-nums text-xs text-ink-muted">{totalDe(estado)}</span>
                </h2>

                <ul className="flex flex-col gap-2">
                  {visibles.map((fila) => {
                    const moviendo = enVuelo.includes(fila.id);
                    return (
                      <li
                        key={fila.id}
                        draggable={!moviendo}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", fila.id);
                          e.dataTransfer.effectAllowed = "move";
                          setArrastrando(fila.id);
                        }}
                        onDragEnd={() => {
                          setArrastrando(null);
                          setEncima(null);
                        }}
                        className={cn(
                          "rounded-md border border-border bg-canvas p-2 shadow-sm",
                          arrastrando === fila.id && "opacity-50",
                          moviendo && "opacity-60",
                        )}
                      >
                        <Link
                          href={`/pedidos/${fila.id}`}
                          className="text-sm font-medium tabular-nums text-ink underline-offset-2 hover:underline focus-visible:underline"
                        >
                          {fila.numero}
                        </Link>
                        <p className="truncate text-sm text-ink">{fila.contacto.nombre || fila.contacto.email || "Sin nombre"}</p>
                        <p className="truncate text-xs text-ink-muted">{fila.servicio ?? "Productos de la tienda"}</p>
                        <p className="text-xs text-ink-subtle">
                          {formatearFechaCorta(fila.creadoEn)}
                          {fila.archivosIncompletos && <span className="ml-2 text-warning-text">Faltan archivos</span>}
                        </p>

                        <label htmlFor={`${idBase}-${fila.id}`} className="sr-only">
                          Mover el pedido {fila.numero} a otro estado
                        </label>
                        <select
                          id={`${idBase}-${fila.id}`}
                          value={estadoDe(fila)}
                          disabled={moviendo}
                          onChange={(e) => mover(fila, e.target.value as EstadoPedido)}
                          className="mt-2 w-full rounded border border-border-strong bg-canvas px-1.5 py-1 text-xs text-ink-muted outline-none focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent/30 disabled:opacity-60"
                        >
                          {ESTADOS_PEDIDO.map((e) => (
                            <option key={e} value={e}>
                              {NOMBRE_ESTADO[e]}
                            </option>
                          ))}
                        </select>
                      </li>
                    );
                  })}

                  {visibles.length === 0 && (
                    <li className="rounded-md border border-dashed border-border px-2 py-6 text-center text-xs text-ink-subtle">
                      {arrastrando ? "Suelta aquí" : "Vacío"}
                    </li>
                  )}
                </ul>

                {ocultos > 0 && (
                  <Link
                    href={`/pedidos?estado=${estado}`}
                    className="mt-2 px-1 text-xs text-accent underline-offset-2 hover:underline"
                  >
                    Ver los {ocultos} más antiguos
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <ConfirmDialog
        open={pendiente !== null}
        onOpenChange={(abierto) => !abierto && setPendiente(null)}
        title={`¿Marcar ${pendiente?.fila.numero ?? ""} como entregado?`}
        description="El pedido queda cerrado y el cliente lo verá como entregado. Si fue un error, se puede volver a otro estado desde el tablero."
        confirmLabel="Marcar entregado"
        onConfirm={async () => {
          if (pendiente) await aplicar(pendiente.fila, pendiente.destino);
          setPendiente(null);
        }}
      />
    </>
  );
}
