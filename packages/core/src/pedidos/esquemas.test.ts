import { describe, expect, it } from "vitest";
import { pedidoEntranteSchema } from "./esquemas";

const pedidoDeServicio = {
  tipo: "servicio" as const,
  serviceId: "afiches",
  detalle: "Necesito un afiche para un evento del colegio.",
  aceptaTerminos: true,
  invitado: {
    nombre: "Ana",
    email: "ana@ejemplo.com",
    telefono: "3001234567",
    ciudad: "Medellín",
  },
};

describe("validación del pedido entrante", () => {
  it("acepta un pedido de servicio completo", () => {
    expect(pedidoEntranteSchema.safeParse(pedidoDeServicio).success).toBe(true);
  });

  it("un servicio sin serviceId no pasa", () => {
    const resultado = pedidoEntranteSchema.safeParse({ ...pedidoDeServicio, serviceId: null });
    expect(resultado.success).toBe(false);
  });

  it("un producto sin items no pasa", () => {
    const resultado = pedidoEntranteSchema.safeParse({
      ...pedidoDeServicio,
      tipo: "producto",
      serviceId: null,
      items: [],
    });
    expect(resultado.success).toBe(false);
  });

  // SPEC.md §11: casilla de aceptación explícita, sin premarcar.
  it("sin aceptar los términos no pasa", () => {
    const resultado = pedidoEntranteSchema.safeParse({
      ...pedidoDeServicio,
      aceptaTerminos: false,
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza más de diez archivos", () => {
    const resultado = pedidoEntranteSchema.safeParse({
      ...pedidoDeServicio,
      archivos: Array.from({ length: 11 }, (_, i) => `jyl/pedidos/${i}`),
    });
    expect(resultado.success).toBe(false);
  });

  it("acepta exactamente diez archivos", () => {
    const resultado = pedidoEntranteSchema.safeParse({
      ...pedidoDeServicio,
      archivos: Array.from({ length: 10 }, (_, i) => `jyl/pedidos/${i}`),
    });
    expect(resultado.success).toBe(true);
  });

  // Lo que el cliente mande de más se ignora: el servidor pone número y estado.
  it("no deja que el cliente imponga número ni estado", () => {
    const resultado = pedidoEntranteSchema.safeParse({
      ...pedidoDeServicio,
      numero: "JYL-2026-9999",
      estado: "entregado",
    });
    expect(resultado.success).toBe(true);
    expect(resultado.success && "numero" in resultado.data).toBe(false);
    expect(resultado.success && "estado" in resultado.data).toBe(false);
  });

  it("exige un correo con forma de correo", () => {
    const resultado = pedidoEntranteSchema.safeParse({
      ...pedidoDeServicio,
      invitado: { ...pedidoDeServicio.invitado, email: "no-es-un-correo" },
    });
    expect(resultado.success).toBe(false);
  });
});
