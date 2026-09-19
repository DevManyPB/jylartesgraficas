"use client";

import { calcularMovimiento, NOMBRE_MOVIMIENTO, TIPOS_MOVIMIENTO, type TipoMovimiento } from "@jyl/core";
import { Modal, useToast } from "@jyl/ui";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { claseEntrada } from "@/components/formularios/Campo";
import { enviarJson } from "@/components/formularios/enviar";

interface RegistrarMovimientoProps {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  /** Qué se mueve: "Camiseta institucional · Negra / M". */
  titulo: string;
  stockActual: number;
  unidad?: string;
  endpoint: string;
}

const AYUDA: Record<TipoMovimiento, string> = {
  entrada: "Llegó mercancía del proveedor.",
  salida: "Se vendió o se usó.",
  merma: "Se dañó o se perdió.",
  ajuste: "Contaste el estante y hay otra cifra: escribe lo que contaste.",
};

/**
 * Registrar un movimiento — SPEC.md §5.1 (formulario en modal) y §6.4. Antes
 * de confirmar muestra con cuánto queda, calculado con la misma función que
 * usa el servidor: lo que se ve aquí es lo que va a pasar.
 */
export function RegistrarMovimiento({ open, onOpenChange, titulo, stockActual, unidad = "unidades", endpoint }: RegistrarMovimientoProps) {
  const { toast } = useToast();
  const router = useRouter();
  const id = useId();
  const [tipo, setTipo] = useState<TipoMovimiento>("entrada");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numero = cantidad.trim() === "" ? null : Number(cantidad);
  const calculo = numero === null || Number.isNaN(numero) ? null : calcularMovimiento(stockActual, tipo, numero);
  const puedeEnviar = calculo?.ok === true && motivo.trim().length >= 3 && !enviando;
  const aMedias = cantidad !== "" || motivo !== "";

  function cerrar(abrir: boolean) {
    if (abrir) return onOpenChange(true);
    setTipo("entrada");
    setCantidad("");
    setMotivo("");
    setError(null);
    onOpenChange(false);
  }

  async function registrar() {
    if (!puedeEnviar || numero === null) return;
    setEnviando(true);
    setError(null);
    const resultado = await enviarJson<{ stockNuevo: number }>(endpoint, "POST", { tipo, cantidad: numero, motivo });
    setEnviando(false);

    if (!resultado.ok) {
      // 409: otra persona movió el stock mientras tanto; se muestra el motivo real.
      setError(resultado.error);
      router.refresh();
      return;
    }
    toast({ title: `${NOMBRE_MOVIMIENTO[tipo]} registrada · quedan ${resultado.datos.stockNuevo}`, variant: "success" });
    cerrar(false);
    router.refresh();
  }

  return (
    // Con datos a medio escribir, un clic fuera no lo cierra (SPEC.md §5.3).
    <Modal open={open} onOpenChange={cerrar} locked={enviando} closeOnOutsideClick={!aMedias} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void registrar();
        }}
        className="flex flex-col gap-4 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <Modal.Title className="font-display text-xl leading-tight text-ink">Registrar movimiento</Modal.Title>
            <Modal.Description className="mt-1 text-sm text-ink-muted">
              {titulo} · hay {stockActual} {unidad}
            </Modal.Description>
          </div>
          <Modal.Close aria-label="Cerrar" disabled={enviando} className="shrink-0 text-ink-subtle hover:text-ink">
            ✕
          </Modal.Close>
        </div>

        <fieldset>
          <legend className="text-[13px] font-medium text-ink">Tipo</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TIPOS_MOVIMIENTO.map((t) => (
              <label
                key={t}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
              >
                <input type="radio" name={`${id}-tipo`} value={t} checked={tipo === t} onChange={() => setTipo(t)} className="accent-accent" />
                {NOMBRE_MOVIMIENTO[t]}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-ink-subtle">{AYUDA[tipo]}</p>
        </fieldset>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-cantidad`} className="text-[13px] font-medium text-ink">
            {tipo === "ajuste" ? "Cuántas hay según el conteo" : "Cantidad"}
          </label>
          <input
            id={`${id}-cantidad`}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value.replace(/[^\d]/g, ""))}
            inputMode="numeric"
            autoComplete="off"
            aria-describedby={`${id}-resultado`}
            className={claseEntrada}
          />
          <p id={`${id}-resultado`} aria-live="polite" className="text-xs">
            {calculo === null ? (
              <span className="text-ink-subtle">Escribe la cantidad para ver con cuánto queda.</span>
            ) : calculo.ok ? (
              <span className="text-ink">
                Quedarán <strong className="tabular-nums">{calculo.stockNuevo}</strong> {unidad} ({calculo.delta > 0 ? "+" : ""}
                {calculo.delta})
              </span>
            ) : (
              <span className="text-danger">{calculo.mensaje}</span>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-motivo`} className="text-[13px] font-medium text-ink">
            Motivo
          </label>
          <input
            id={`${id}-motivo`}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={200}
            placeholder={tipo === "entrada" ? "Ej.: pedido al proveedor, factura 1234" : "Ej.: venta en el local"}
            className={claseEntrada}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <div className="mt-2 flex justify-end gap-3">
          <Modal.Close asChild>
            <button type="button" disabled={enviando} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-muted hover:bg-canvas-sunken">
              Cancelar
            </button>
          </Modal.Close>
          <button
            type="submit"
            disabled={!puedeEnviar}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-ink-inverted hover:bg-accent-hover disabled:opacity-40"
          >
            {enviando ? "Registrando…" : "Registrar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
