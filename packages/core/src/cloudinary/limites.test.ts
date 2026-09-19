import { describe, expect, it } from "vitest";
import { MAX_BYTES_POR_ARCHIVO, formatoPermitido, revisarArchivo } from "./limites";

describe("límites de archivos", () => {
  it("acepta los formatos del formulario de pedido", () => {
    for (const formato of ["jpg", "png", "webp", "pdf", "ai", "psd"]) {
      expect(formatoPermitido(formato)).toBe(true);
    }
  });

  it("no le importa si el formato viene en mayúsculas", () => {
    expect(formatoPermitido("PNG")).toBe(true);
  });

  it("rechaza un ejecutable aunque lo disfracen", () => {
    expect(formatoPermitido("exe")).toBe(false);
    expect(revisarArchivo({ format: "exe", bytes: 100 })?.motivo).toBe("formato");
  });

  it("acepta un archivo justo en el límite de 10 MB", () => {
    expect(revisarArchivo({ format: "png", bytes: MAX_BYTES_POR_ARCHIVO })).toBeNull();
  });

  it("rechaza un byte por encima del límite", () => {
    const problema = revisarArchivo({ format: "png", bytes: MAX_BYTES_POR_ARCHIVO + 1 });
    expect(problema?.motivo).toBe("tamaño");
    // El error dice qué pasó y qué hacer — AGENTS.md §10.
    expect(problema?.mensaje).toContain("Quítalo o reemplázalo");
  });
});
