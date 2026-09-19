/**
 * La aritmética de la factura, sin Firestore — SPEC.md §6.5.
 *
 * El servidor la usa al guardar y al emitir, y el formulario para mostrar el
 * total mientras se escribe. Lo que se guarda siempre sale de aquí en el
 * servidor: nunca se confía en un total que llegue del navegador (§7
 * principio 6).
 */

export interface LineaParaCalcular {
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

export interface Totales {
  /** Suma de cantidad × precio, antes de descuentos. */
  subtotal: number;
  /** Suma de los descuentos de las líneas. */
  descuento: number;
  /** Impuesto sobre (subtotal − descuento). */
  impuesto: number;
  total: number;
}

/** Todo en pesos enteros: el impuesto se redondea al peso más cercano. */
export function calcularTotales(lineas: readonly LineaParaCalcular[], impuestoPorcentaje: number | null): Totales {
  const subtotal = lineas.reduce((suma, l) => suma + l.cantidad * l.precioUnitario, 0);
  const descuento = lineas.reduce((suma, l) => suma + l.descuento, 0);
  const base = subtotal - descuento;
  const impuesto = Math.round((base * (impuestoPorcentaje ?? 0)) / 100);
  return { subtotal, descuento, impuesto, total: base + impuesto };
}

export function totalDeLinea(linea: LineaParaCalcular): number {
  return linea.cantidad * linea.precioUnitario - linea.descuento;
}

/** Lo que falta por pagar. Nunca negativo. */
export function saldoPendiente(total: number, pagos: readonly { monto: number }[]): number {
  return Math.max(0, total - pagos.reduce((suma, p) => suma + p.monto, 0));
}

/** `FAC-2026-0001` — SPEC.md §6.5. */
export function formatearNumeroFactura(anio: number, consecutivo: number): string {
  return `FAC-${anio}-${String(consecutivo).padStart(4, "0")}`;
}

/**
 * Unidades que la factura saca de cada variante, sumando las líneas que
 * repiten variante. La clave es `productId/variantId`.
 */
export function unidadesPorVariante(
  lineas: readonly { cantidad: number; productId: string | null; variantId: string | null }[],
): Map<string, { productId: string; variantId: string; cantidad: number }> {
  const porVariante = new Map<string, { productId: string; variantId: string; cantidad: number }>();
  for (const l of lineas) {
    if (!l.productId || !l.variantId) continue;
    const clave = `${l.productId}/${l.variantId}`;
    const actual = porVariante.get(clave);
    if (actual) actual.cantidad += l.cantidad;
    else porVariante.set(clave, { productId: l.productId, variantId: l.variantId, cantidad: l.cantidad });
  }
  return porVariante;
}
