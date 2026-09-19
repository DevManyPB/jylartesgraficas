import { describe, expect, it } from "vitest";
import { calcularMovimiento, estadoDeStock } from "./stock";

describe("calcularMovimiento", () => {
  it("una entrada suma", () => {
    expect(calcularMovimiento(3, "entrada", 10)).toEqual({ ok: true, delta: 10, stockNuevo: 13 });
  });

  it("una salida y una merma restan", () => {
    expect(calcularMovimiento(8, "salida", 3)).toEqual({ ok: true, delta: -3, stockNuevo: 5 });
    expect(calcularMovimiento(8, "merma", 1)).toEqual({ ok: true, delta: -1, stockNuevo: 7 });
  });

  it("se puede sacar justo todo lo que hay", () => {
    expect(calcularMovimiento(2, "salida", 2)).toEqual({ ok: true, delta: -2, stockNuevo: 0 });
  });

  it("nunca deja el stock en negativo", () => {
    const r = calcularMovimiento(2, "salida", 3);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensaje).toContain("Solo quedan 2");
  });

  it("un ajuste fija lo contado y registra la diferencia", () => {
    expect(calcularMovimiento(10, "ajuste", 7)).toEqual({ ok: true, delta: -3, stockNuevo: 7 });
    expect(calcularMovimiento(0, "ajuste", 4)).toEqual({ ok: true, delta: 4, stockNuevo: 4 });
  });

  it("un ajuste al mismo número no es un movimiento", () => {
    expect(calcularMovimiento(5, "ajuste", 5).ok).toBe(false);
  });

  it("rechaza cantidades en cero, negativas o con decimales", () => {
    expect(calcularMovimiento(5, "entrada", 0).ok).toBe(false);
    expect(calcularMovimiento(5, "entrada", -2).ok).toBe(false);
    expect(calcularMovimiento(5, "salida", 1.5).ok).toBe(false);
  });
});

describe("estadoDeStock", () => {
  it("distingue agotado, bajo mínimo y normal", () => {
    expect(estadoDeStock(0, 5)).toBe("agotado");
    expect(estadoDeStock(3, 5)).toBe("bajo");
    expect(estadoDeStock(5, 5)).toBe("bajo");
    expect(estadoDeStock(6, 5)).toBe("ok");
    expect(estadoDeStock(1, 0)).toBe("ok");
  });
});
