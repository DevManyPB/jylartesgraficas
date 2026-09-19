import { describe, expect, it } from "vitest";
import { calcularTotales, formatearNumeroFactura, saldoPendiente, totalDeLinea, unidadesPorVariante } from "./calculo";
import { borradorFacturaSchema, lineaFacturaSchema } from "./esquemas";

describe("calcularTotales", () => {
  it("suma líneas, resta descuentos y aplica el impuesto sobre la base", () => {
    const t = calcularTotales(
      [
        { cantidad: 2, precioUnitario: 50_000, descuento: 10_000 },
        { cantidad: 1, precioUnitario: 30_000, descuento: 0 },
      ],
      19,
    );
    expect(t).toEqual({ subtotal: 130_000, descuento: 10_000, impuesto: 22_800, total: 142_800 });
  });

  it("sin impuesto configurado no suma impuesto", () => {
    expect(calcularTotales([{ cantidad: 3, precioUnitario: 1_000, descuento: 0 }], null)).toEqual({
      subtotal: 3_000,
      descuento: 0,
      impuesto: 0,
      total: 3_000,
    });
  });

  it("redondea el impuesto al peso", () => {
    expect(calcularTotales([{ cantidad: 1, precioUnitario: 999, descuento: 0 }], 19).impuesto).toBe(190);
  });
});

describe("saldo y línea", () => {
  it("el saldo baja con los pagos y nunca es negativo", () => {
    expect(saldoPendiente(100_000, [{ monto: 40_000 }])).toBe(60_000);
    expect(saldoPendiente(100_000, [{ monto: 60_000 }, { monto: 60_000 }])).toBe(0);
  });

  it("el total de la línea descuenta sobre el total, no por unidad", () => {
    expect(totalDeLinea({ cantidad: 3, precioUnitario: 10_000, descuento: 5_000 })).toBe(25_000);
  });
});

describe("formatearNumeroFactura", () => {
  it("rellena a cuatro cifras", () => {
    expect(formatearNumeroFactura(2026, 42)).toBe("FAC-2026-0042");
    expect(formatearNumeroFactura(2026, 12345)).toBe("FAC-2026-12345");
  });
});

describe("unidadesPorVariante", () => {
  it("suma las líneas que repiten variante e ignora las libres", () => {
    const r = unidadesPorVariante([
      { cantidad: 2, productId: "p", variantId: "v1" },
      { cantidad: 1, productId: null, variantId: null },
      { cantidad: 3, productId: "p", variantId: "v1" },
      { cantidad: 1, productId: "p", variantId: "v2" },
    ]);
    expect([...r.values()]).toEqual([
      { productId: "p", variantId: "v1", cantidad: 5 },
      { productId: "p", variantId: "v2", cantidad: 1 },
    ]);
  });
});

describe("esquemas", () => {
  const linea = { descripcion: "Pendón 1 × 2 m", cantidad: 1, precioUnitario: 80_000 };

  it("un descuento mayor que la línea no pasa", () => {
    expect(lineaFacturaSchema.safeParse({ ...linea, descuento: 90_000 }).success).toBe(false);
  });

  it("una línea vinculada a medias no pasa", () => {
    expect(lineaFacturaSchema.safeParse({ ...linea, productId: "p" }).success).toBe(false);
  });

  it("no acepta decimales en pesos", () => {
    expect(lineaFacturaSchema.safeParse({ ...linea, precioUnitario: 1000.5 }).success).toBe(false);
  });

  it("un borrador necesita al menos una línea", () => {
    const r = borradorFacturaSchema.safeParse({ clienteDatos: { nombre: "Ana Pérez" }, lineas: [] });
    expect(r.success).toBe(false);
  });

  it("descarta totales que lleguen del navegador", () => {
    const r = borradorFacturaSchema.parse({ clienteDatos: { nombre: "Ana Pérez" }, lineas: [linea], total: 1 });
    expect(r).not.toHaveProperty("total");
  });
});
