/**
 * La aritmética del stock, sin Firestore — SPEC.md §6.4.
 *
 * Está aparte para poder probarla sin emulador: la transacción del servidor
 * solo lee, llama aquí y escribe lo que esto devuelve.
 */

export const TIPOS_MOVIMIENTO = ["entrada", "salida", "ajuste", "merma"] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export const NOMBRE_MOVIMIENTO: Record<TipoMovimiento, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste por conteo",
  merma: "Merma",
};

export type ResultadoMovimiento =
  | { ok: true; delta: number; stockNuevo: number }
  | { ok: false; mensaje: string };

/**
 * - entrada: suma lo que llegó.
 * - salida: resta lo que se vendió o se usó.
 * - merma: resta lo que se dañó o se perdió.
 * - ajuste: la `cantidad` es lo que se contó en el estante; el stock pasa a
 *   ser eso, y la diferencia queda registrada como delta.
 *
 * Nunca deja el stock en negativo: si se intenta sacar más de lo que hay, es
 * que el registro está mal, y aceptarlo escondería el error.
 */
export function calcularMovimiento(stockActual: number, tipo: TipoMovimiento, cantidad: number): ResultadoMovimiento {
  if (!Number.isInteger(cantidad) || cantidad < 0) {
    return { ok: false, mensaje: "La cantidad tiene que ser un número entero." };
  }
  if (tipo !== "ajuste" && cantidad === 0) {
    return { ok: false, mensaje: "La cantidad tiene que ser mayor que cero." };
  }

  if (tipo === "ajuste") {
    if (cantidad === stockActual) return { ok: false, mensaje: `El stock ya es ${stockActual}: no hay nada que ajustar.` };
    return { ok: true, delta: cantidad - stockActual, stockNuevo: cantidad };
  }

  const delta = tipo === "entrada" ? cantidad : -cantidad;
  const stockNuevo = stockActual + delta;
  if (stockNuevo < 0) {
    return {
      ok: false,
      mensaje:
        stockActual === 0
          ? "No hay unidades en stock para sacar."
          : `Solo quedan ${stockActual} en stock; no se pueden sacar ${cantidad}.`,
    };
  }
  return { ok: true, delta, stockNuevo };
}

/** SPEC.md §6.4: alerta cuando `stock <= stockMinimo`. Con mínimo 0 solo alerta el agotado. */
export function estadoDeStock(stock: number, stockMinimo: number): "agotado" | "bajo" | "ok" {
  if (stock <= 0) return "agotado";
  if (stock <= stockMinimo) return "bajo";
  return "ok";
}
