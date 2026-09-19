import { describe, expect, it } from "vitest";
import { normalizarNumeroBuscado } from "./panel";

describe("normalizarNumeroBuscado", () => {
  it.each([
    ["JYL-2026-0042", "JYL-2026-0042"],
    ["jyl-2026-42", "JYL-2026-0042"],
    ["  JYL-2025-7 ", "JYL-2025-0007"],
    ["42", "JYL-2026-0042"],
    ["0042", "JYL-2026-0042"],
  ])("%s → %s", (entrada, esperado) => {
    expect(normalizarNumeroBuscado(entrada, 2026)).toBe(esperado);
  });

  it.each(["", "Marta", "JYL-26-1", "JYL-2026-", "42a"])("rechaza %j", (entrada) => {
    expect(normalizarNumeroBuscado(entrada, 2026)).toBeNull();
  });
});
