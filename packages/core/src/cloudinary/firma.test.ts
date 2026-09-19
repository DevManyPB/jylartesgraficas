import { describe, expect, it } from "vitest";
import { crearPermisoDeSubida, firmarParametros } from "./firma";

describe("firma de Cloudinary", () => {
  // Ejemplo de la documentación: public_id=test, timestamp=1315060510,
  // secret "mysecret". Fija el orden alfabético, la unión con & y que el
  // secret se concatena sin separador; si algo de eso cambia, esto falla.
  it("reproduce el ejemplo de la documentación", () => {
    expect(
      firmarParametros({ public_id: "test", timestamp: 1315060510 }, "mysecret"),
    ).toBe("86000cd7c661e752b8face0704ef2f992346f62d");
  });

  it("ordena alfabéticamente, no por orden de escritura", () => {
    const enUnOrden = firmarParametros({ timestamp: 1, folder: "a", public_id: "b" }, "s");
    const enOtro = firmarParametros({ public_id: "b", timestamp: 1, folder: "a" }, "s");
    expect(enUnOrden).toBe(enOtro);
  });

  it("cambia si cambia el secret", () => {
    const parametros = { public_id: "test", timestamp: 1315060510 };
    expect(firmarParametros(parametros, "mysecret")).not.toBe(
      firmarParametros(parametros, "otro"),
    );
  });

  it("el permiso firma la carpeta y el public_id que impone el servidor", () => {
    const permiso = crearPermisoDeSubida({
      cloudName: "nube",
      apiKey: "123",
      apiSecret: "secreto",
      folder: "jyl/pedidos",
      publicId: "abc",
      timestamp: 1700000000,
    });

    expect(permiso.signature).toBe(
      firmarParametros(
        { folder: "jyl/pedidos", public_id: "abc", timestamp: 1700000000 },
        "secreto",
      ),
    );
    // El secret nunca viaja al navegador.
    expect(JSON.stringify(permiso)).not.toContain("secreto");
  });
});
