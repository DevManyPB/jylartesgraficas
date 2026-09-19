import { describe, expect, it } from "vitest";
import { normalizarTexto, planDeBusqueda, tokensDeBusqueda } from "./busqueda";

const LAURA = { numero: "JYL-2026-0042", nombre: "Laura Méndez", email: "laura.m@gmail.com", telefono: "301 222 3344" };

describe("tokensDeBusqueda", () => {
  const tokens = tokensDeBusqueda(LAURA);

  it("encuentra por prefijo del nombre, sin tildes ni mayúsculas", () => {
    expect(tokens).toEqual(expect.arrayContaining(["la", "lau", "laura", "me", "mendez"]));
  });

  it("encuentra por teléfono completo y por sus últimos cuatro dígitos", () => {
    expect(tokens).toEqual(expect.arrayContaining(["3012223344", "3344"]));
  });

  it("encuentra por número de pedido", () => {
    expect(tokens).toContain("jyl-2026-0042");
  });

  it("no indexa el dominio del correo", () => {
    expect(tokens).not.toContain("gmail");
  });

  it("no guarda palabras de una sola letra ni repite entradas", () => {
    expect(tokens.every((t) => t.length >= 2)).toBe(true);
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});

describe("planDeBusqueda", () => {
  it("consulta por la palabra más larga y exige el resto", () => {
    expect(planDeBusqueda("Laura Méndez")).toEqual({ consulta: "mendez", resto: ["laura"] });
  });

  it("acepta teléfonos escritos con espacios", () => {
    expect(planDeBusqueda("301 222 3344")).toEqual({ consulta: "3012223344", resto: [] });
  });

  it("descarta búsquedas sin nada útil", () => {
    expect(planDeBusqueda("a")).toBeNull();
    expect(planDeBusqueda("  ")).toBeNull();
  });

  it("normaliza igual al guardar y al buscar", () => {
    expect(normalizarTexto("ÑANDÚ")).toBe("nandu");
  });
});
