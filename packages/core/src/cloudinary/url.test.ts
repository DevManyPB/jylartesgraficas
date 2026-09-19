import { describe, expect, it } from "vitest";
import { miniaturaDesdeUrl, srcSetDeImagen, urlDeDescarga, urlDeImagen } from "./url";

describe("URLs de Cloudinary", () => {
  // AGENTS.md §5 lo exige siempre, en toda transformación.
  it("siempre lleva formato y calidad automáticos", () => {
    expect(urlDeImagen("nube", "jyl/portafolio/pieza")).toContain("f_auto,q_auto");
    expect(urlDeImagen("nube", "jyl/portafolio/pieza", { ancho: 800 })).toContain("f_auto,q_auto");
  });

  it("sin medidas no añade recorte", () => {
    expect(urlDeImagen("nube", "pieza")).toBe(
      "https://res.cloudinary.com/nube/image/upload/f_auto,q_auto/pieza",
    );
  });

  // SPEC.md §9: las piezas del portafolio conservan su proporción real.
  it("por defecto usa limit, que no agranda ni deforma", () => {
    expect(urlDeImagen("nube", "pieza", { ancho: 800 })).toContain("c_limit");
  });

  it("genera el srcSet con un ancho por entrada", () => {
    expect(srcSetDeImagen("nube", "pieza", [400, 800])).toBe(
      "https://res.cloudinary.com/nube/image/upload/f_auto,q_auto,w_400,c_limit/pieza 400w, " +
        "https://res.cloudinary.com/nube/image/upload/f_auto,q_auto,w_800,c_limit/pieza 800w",
    );
  });
});

describe("miniaturaDesdeUrl y urlDeDescarga", () => {
  const imagen = "https://res.cloudinary.com/demo/image/upload/v17/jyl/pedidos/abc.png";
  const pdf = "https://res.cloudinary.com/demo/image/upload/v17/jyl/pedidos/abc.pdf";
  const raw = "https://res.cloudinary.com/demo/raw/upload/v17/jyl/pedidos/abc.ai";

  it("recorta la miniatura cuadrada con formato automático", () => {
    expect(miniaturaDesdeUrl(imagen, 200)).toBe(
      "https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,pg_1,w_200,h_200,c_fill/v17/jyl/pedidos/abc.png",
    );
  });

  it("da vista previa de la primera página de un PDF", () => {
    expect(miniaturaDesdeUrl(pdf, 200)).toMatch(/pg_1.*abc\.jpg$/);
  });

  it("no inventa miniatura para un archivo raw", () => {
    expect(miniaturaDesdeUrl(raw, 200)).toBeNull();
  });

  it("fuerza la descarga de imágenes y deja igual los raw", () => {
    expect(urlDeDescarga(imagen)).toBe("https://res.cloudinary.com/demo/image/upload/fl_attachment/v17/jyl/pedidos/abc.png");
    expect(urlDeDescarga(raw)).toBe(raw);
  });
});
