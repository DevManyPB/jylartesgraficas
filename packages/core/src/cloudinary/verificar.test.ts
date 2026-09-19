import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verificarSubida } from "./verificar";

/**
 * Estas pruebas no hablan con Cloudinary: sustituyen `fetch` para poder
 * provocar a voluntad el caso que nos costó encontrar en el navegador — que la
 * API de administración todavía no ve un archivo recién subido.
 */

const RECURSO = {
  public_id: "jyl/pedidos/abc",
  secure_url: "https://res.cloudinary.com/demo/image/upload/v1/jyl/pedidos/abc.png",
  format: "png",
  bytes: 1024,
  width: 800,
  height: 600,
};

const ok = (cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: 200, headers: { "Content-Type": "application/json" } });
const noEncontrado = () => new Response("{}", { status: 404 });

let fetchFalso: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  process.env.CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "clave";
  process.env.CLOUDINARY_API_SECRET = "secreto";
  fetchFalso = vi.fn();
  vi.stubGlobal("fetch", fetchFalso);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Deja correr los `setTimeout` de los reintentos mientras la promesa avanza. */
async function resolverConReintentos<T>(promesa: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return promesa;
}

describe("verificarSubida", () => {
  it("devuelve los datos del archivo cuando Cloudinary lo encuentra a la primera", async () => {
    fetchFalso.mockResolvedValue(ok(RECURSO));

    const resultado = await resolverConReintentos(verificarSubida("jyl/pedidos/abc"));

    expect(resultado).toEqual({
      ok: true,
      archivo: {
        publicId: "jyl/pedidos/abc",
        url: RECURSO.secure_url,
        formato: "png",
        bytes: 1024,
        ancho: 800,
        alto: 600,
      },
    });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("reintenta cuando el archivo todavía no está indexado y acaba encontrándolo", async () => {
    // Primera vuelta: ni `image` ni `raw`. Segunda: ya aparece.
    fetchFalso
      .mockResolvedValueOnce(noEncontrado())
      .mockResolvedValueOnce(noEncontrado())
      .mockResolvedValue(ok(RECURSO));

    const resultado = await resolverConReintentos(verificarSubida("jyl/pedidos/abc"));

    expect(resultado.ok).toBe(true);
    expect(fetchFalso.mock.calls.length).toBeGreaterThan(2);
  });

  it("se rinde si tras los reintentos el archivo sigue sin aparecer", async () => {
    fetchFalso.mockResolvedValue(noEncontrado());

    const resultado = await resolverConReintentos(verificarSubida("jyl/pedidos/abc"));

    expect(resultado).toEqual({
      ok: false,
      problema: {
        motivo: "formato",
        mensaje: "No encontramos el archivo que dices haber subido.",
      },
    });
  });

  it("busca en `raw` cuando no está en `image`", async () => {
    fetchFalso.mockImplementation((url: string) =>
      Promise.resolve(url.includes("/raw/") ? ok({ ...RECURSO, format: "pdf" }) : noEncontrado()),
    );

    const resultado = await resolverConReintentos(verificarSubida("jyl/pedidos/abc"));

    expect(resultado.ok).toBe(true);
    expect(fetchFalso.mock.calls.some(([url]) => String(url).includes("/raw/"))).toBe(true);
  });

  it("borra el archivo y lo rechaza si el formato no está permitido", async () => {
    fetchFalso.mockImplementation((url: string, opciones?: RequestInit) =>
      Promise.resolve(opciones?.method === "DELETE" ? ok({ deleted: {} }) : ok({ ...RECURSO, format: "exe" })),
    );

    const resultado = await resolverConReintentos(verificarSubida("jyl/pedidos/abc"));

    expect(resultado.ok).toBe(false);
    // No basta con rechazarlo: si se queda subido, ocupa cuota para siempre.
    expect(fetchFalso.mock.calls.some(([, opciones]) => opciones?.method === "DELETE")).toBe(true);
  });

  it("borra el archivo y lo rechaza si pesa más de lo permitido", async () => {
    fetchFalso.mockImplementation((url: string, opciones?: RequestInit) =>
      Promise.resolve(
        opciones?.method === "DELETE" ? ok({ deleted: {} }) : ok({ ...RECURSO, bytes: 11 * 1024 * 1024 }),
      ),
    );

    const resultado = await resolverConReintentos(verificarSubida("jyl/pedidos/abc"));

    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.problema.motivo).toBe("tamaño");
    expect(fetchFalso.mock.calls.some(([, opciones]) => opciones?.method === "DELETE")).toBe(true);
  });

  it("con `tipo` explícito no busca en los demás", async () => {
    fetchFalso.mockResolvedValue(noEncontrado());

    await resolverConReintentos(verificarSubida("jyl/pedidos/abc", "image"));

    expect(fetchFalso.mock.calls.every(([url]) => String(url).includes("/image/"))).toBe(true);
  });
});
