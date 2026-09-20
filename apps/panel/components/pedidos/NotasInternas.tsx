"use client";

import { useToast } from "@jyl/ui";
import { useId, useState } from "react";
import { useProtegerCambios } from "@/components/cambios/CambiosSinGuardar";
import { claseEntrada } from "@/components/formularios/Campo";
import { enviarJson } from "@/components/formularios/enviar";

interface NotasInternasProps {
  /** Route Handler que las guarda, con PUT. */
  endpoint: string;
  inicial: string;
  /** Nombre del campo que espera el servidor. */
  campo?: string;
  /** Qué son estas notas, para la etiqueta. */
  etiqueta?: string;
}

/** Notas que solo ve el estudio. Salir con cambios sin guardar pregunta. */
export function NotasInternas({ endpoint, inicial, campo = "notasInternas", etiqueta = "Notas internas" }: NotasInternasProps) {
  const { toast } = useToast();
  const id = useId();
  const [guardado, setGuardado] = useState(inicial);
  const [texto, setTexto] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const hayCambios = texto !== guardado;

  async function guardar(): Promise<boolean> {
    setGuardando(true);
    const resultado = await enviarJson(endpoint, "PUT", { [campo]: texto });
    setGuardando(false);

    if (!resultado.ok) {
      toast({ title: "No se guardaron las notas", description: resultado.error, variant: "error" });
      return false;
    }
    setGuardado(texto);
    toast({ title: "Notas guardadas", variant: "success" });
    return true;
  }

  useProtegerCambios(hayCambios, guardar);

  return (
    <form
      onSubmit={(evento) => {
        evento.preventDefault();
        void guardar();
      }}
      className="flex flex-col gap-2"
    >
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {etiqueta} <span className="font-normal text-ink-subtle">· el cliente no las ve</span>
      </label>
      <textarea
        id={id}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={5}
        maxLength={5000}
        className={claseEntrada}
      />
      <button
        type="submit"
        disabled={!hayCambios || guardando}
        className="self-start rounded-md border border-border-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken disabled:opacity-50"
      >
        {guardando ? "Guardando…" : "Guardar notas"}
      </button>
    </form>
  );
}
