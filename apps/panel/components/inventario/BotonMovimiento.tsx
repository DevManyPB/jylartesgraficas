"use client";

import { useState } from "react";
import { RegistrarMovimiento } from "./RegistrarMovimiento";

/** Botón que abre el registro de movimiento. El modal queda montado al cerrar para devolver el foco. */
export function BotonMovimiento(props: { titulo: string; stockActual: number; unidad?: string; endpoint: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-ink-inverted hover:bg-accent-hover"
      >
        Registrar movimiento
      </button>
      <RegistrarMovimiento open={abierto} onOpenChange={setAbierto} {...props} />
    </>
  );
}
