import { describe, expect, it } from "vitest";
import { slugDe } from "../catalogo/slug";
import { servicioEditableSchema } from "./esquemas";

describe("slugDe", () => {
  it("quita tildes y signos igual que la siembra", () => {
    expect(slugDe("Afiches y pósters")).toBe("afiches-y-posters");
    expect(slugDe("Instalación de software y drivers")).toBe("instalacion-de-software-y-drivers");
    expect(slugDe("  ¡Diseño 3D!  ")).toBe("diseno-3d");
  });
});

describe("servicioEditableSchema", () => {
  const base = { nombre: "Vinilos decorativos", categoria: "publicidad" as const };

  it("aplica los valores por defecto sin inventar precio", () => {
    const r = servicioEditableSchema.parse(base);
    expect(r).toMatchObject({ descripcion: "", precioBase: null, activo: true });
  });

  it("rechaza una categoría que no existe", () => {
    expect(servicioEditableSchema.safeParse({ ...base, categoria: "otra" }).success).toBe(false);
  });

  it("exige el precio en pesos enteros y no negativos", () => {
    expect(servicioEditableSchema.safeParse({ ...base, precioBase: 1500.5 }).success).toBe(false);
    expect(servicioEditableSchema.safeParse({ ...base, precioBase: -1 }).success).toBe(false);
    expect(servicioEditableSchema.safeParse({ ...base, precioBase: 45000 }).success).toBe(true);
  });

  it("ignora campos que el panel no puede tocar", () => {
    const r = servicioEditableSchema.parse({ ...base, slug: "otro", orden: 99 });
    expect(r).not.toHaveProperty("slug");
    expect(r).not.toHaveProperty("orden");
  });
});
