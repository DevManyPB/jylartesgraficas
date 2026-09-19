"use client";

import { METODOS_PAGO, NOMBRE_METODO_PAGO, type MetodoPago } from "@jyl/core";
import { Modal, useToast } from "@jyl/ui";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { claseEntrada } from "@/components/formularios/Campo";
import { enviarJson } from "@/components/formularios/enviar";
import { pesos } from "@/components/pedidos/formato";

/** Hoy en Colombia, como `2026-09-19`. */
function hoy(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

interface RegistrarPagoProps {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  facturaId: string;
  numero: string;
  saldo: number;
}

/** Registrar un pago, parcial o total — SPEC.md §6.5. Formulario en modal (§5.1). */
export function RegistrarPago({ open, onOpenChange, facturaId, numero, saldo }: RegistrarPagoProps) {
  const { toast } = useToast();
  const router = useRouter();
  const id = useId();
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(hoy);
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valor = monto === "" ? null : Number(monto);
  const demasiado = valor !== null && valor > saldo;
  const puedeEnviar = valor !== null && valor > 0 && !demasiado && fecha !== "" && !enviando;

  function cerrar(abrir: boolean) {
    if (abrir) return onOpenChange(true);
    setMonto("");
    setFecha(hoy());
    setMetodo("efectivo");
    setError(null);
    onOpenChange(false);
  }

  async function registrar() {
    if (!puedeEnviar || valor === null) return;
    setEnviando(true);
    setError(null);
    const r = await enviarJson<{ saldo: number }>(`/api/facturas/${facturaId}/pagos`, "POST", { fecha, monto: valor, metodo });
    setEnviando(false);
    if (!r.ok) {
      setError(r.error);
      router.refresh();
      return;
    }
    toast({
      title: r.datos.saldo === 0 ? `${numero} quedó pagada` : `Pago registrado · faltan ${pesos.format(r.datos.saldo)}`,
      variant: "success",
    });
    cerrar(false);
    router.refresh();
  }

  return (
    <Modal open={open} onOpenChange={cerrar} locked={enviando} closeOnOutsideClick={monto === ""} size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void registrar();
        }}
        className="flex flex-col gap-4 p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <Modal.Title className="font-display text-xl leading-tight text-ink">Registrar pago</Modal.Title>
            <Modal.Description className="mt-1 text-sm text-ink-muted">
              {numero} · falta por pagar {pesos.format(saldo)}
            </Modal.Description>
          </div>
          <Modal.Close aria-label="Cerrar" disabled={enviando} className="shrink-0 text-ink-subtle hover:text-ink">
            ✕
          </Modal.Close>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`${id}-monto`} className="text-[13px] font-medium text-ink">
            Monto
          </label>
          <div className="flex gap-2">
            <input
              id={`${id}-monto`}
              value={monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              aria-invalid={demasiado}
              aria-describedby={`${id}-ayuda`}
              className={claseEntrada}
            />
            <button
              type="button"
              onClick={() => setMonto(String(saldo))}
              className="shrink-0 rounded-md border border-border-strong px-3 text-sm text-ink hover:bg-canvas-sunken"
            >
              Todo
            </button>
          </div>
          <p id={`${id}-ayuda`} aria-live="polite" className={`text-xs ${demasiado ? "text-danger" : "text-ink-subtle"}`}>
            {demasiado
              ? `Es más de lo que falta (${pesos.format(saldo)}).`
              : valor
                ? valor === saldo
                  ? "Con este pago la factura queda pagada."
                  : `Quedarán ${pesos.format(saldo - valor)} por pagar.`
                : "En pesos, sin puntos."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-fecha`} className="text-[13px] font-medium text-ink">
              Fecha
            </label>
            <input id={`${id}-fecha`} type="date" value={fecha} max={hoy()} onChange={(e) => setFecha(e.target.value)} className={claseEntrada} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-metodo`} className="text-[13px] font-medium text-ink">
              Método
            </label>
            <select id={`${id}-metodo`} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)} className={claseEntrada}>
              {METODOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {NOMBRE_METODO_PAGO[m]}
                </option>
              ))}
            </select>
          </div>
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
