import { deleteApp, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { formatearNumeroPedido, siguienteNumeroDePedido } from "./numeracion";

describe("formato del número", () => {
  it("rellena con ceros hasta cuatro cifras", () => {
    expect(formatearNumeroPedido(2026, 1)).toBe("JYL-2026-0001");
    expect(formatearNumeroPedido(2026, 147)).toBe("JYL-2026-0147");
  });

  it("no recorta cuando se pasa de cuatro cifras", () => {
    expect(formatearNumeroPedido(2026, 12345)).toBe("JYL-2026-12345");
  });
});

describe("consecutivo contra el emulador", () => {
  let app: App;
  let db: Firestore;

  beforeAll(() => {
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
    app = initializeApp({ projectId: "jyl-numeracion-test" }, "numeracion");
    db = getFirestore(app);
  });

  afterAll(async () => {
    await deleteApp(app);
  });

  beforeEach(async () => {
    await db.collection("counters").doc(String(new Date().getFullYear())).delete();
  });

  it("empieza en 1 y avanza de uno en uno", async () => {
    const anio = new Date().getFullYear();
    expect(await siguienteNumeroDePedido(db)).toBe(formatearNumeroPedido(anio, 1));
    expect(await siguienteNumeroDePedido(db)).toBe(formatearNumeroPedido(anio, 2));
    expect(await siguienteNumeroDePedido(db)).toBe(formatearNumeroPedido(anio, 3));
  });

  /**
   * La prueba que justifica la transacción: leyendo "el último documento",
   * dos pedidos simultáneos se llevarían el mismo número. AGENTS.md §6.
   */
  it("con diez pedidos a la vez no repite ni deja huecos", async () => {
    const anio = new Date().getFullYear();

    const numeros = await Promise.all(
      Array.from({ length: 10 }, () => siguienteNumeroDePedido(db)),
    );

    expect(new Set(numeros).size).toBe(10);
    expect([...numeros].sort()).toEqual(
      Array.from({ length: 10 }, (_, i) => formatearNumeroPedido(anio, i + 1)).sort(),
    );
  });
});
