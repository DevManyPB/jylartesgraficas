import { beforeAll, describe, expect, it } from "vitest";

process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS = "true";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "jyl-resumen-test";

const { getFirebaseAdmin } = await import("../firebase/admin");
const { leerResumen, mesEnColombia, recalcularResumen } = await import("./resumen");
const { Timestamp } = await import("firebase-admin/firestore");

const db = () => getFirebaseAdmin().db;
const AHORA = new Date("2026-09-20T15:00:00Z");

/** Una factura ya emitida, sin pasar por el flujo: aquí se prueba el resumen. */
async function factura(estado: string, total: number, saldo: number, emitidaEn: Date) {
  await db().collection("invoices").add({
    estado,
    total,
    saldo,
    emitidaEn: Timestamp.fromDate(emitidaEn),
    createdAt: Timestamp.fromDate(emitidaEn),
    clienteDatos: { nombre: "Cliente" },
    lineas: [],
  });
}

describe("mesEnColombia", () => {
  it("empieza y termina a medianoche de Bogotá, no de UTC", () => {
    const { inicio, fin } = mesEnColombia(AHORA);
    expect(inicio.toISOString()).toBe("2026-09-01T05:00:00.000Z");
    expect(fin.toISOString()).toBe("2026-10-01T05:00:00.000Z");
  });

  it("el mes anterior cruza bien el cambio de año", () => {
    expect(mesEnColombia(new Date("2027-01-10T12:00:00Z"), -1).inicio.toISOString()).toBe("2026-12-01T05:00:00.000Z");
  });

  it("el 30 de septiembre a las 11 p. m. de Bogotá sigue siendo septiembre", () => {
    // 2026-10-01T04:00Z es 2026-09-30 23:00 en Bogotá.
    expect(mesEnColombia(new Date("2026-10-01T04:00:00Z")).inicio.toISOString()).toBe("2026-09-01T05:00:00.000Z");
  });
});

describe("resumen contra el emulador", () => {
  beforeAll(async () => {
    for (const c of ["orders", "invoices", "products", "stats"]) {
      await db().recursiveDelete(db().collection(c));
    }

    await Promise.all([
      db().collection("orders").add({ estado: "recibido" }),
      db().collection("orders").add({ estado: "recibido" }),
      db().collection("orders").add({ estado: "en_produccion" }),
      db().collection("orders").add({ estado: "entregado" }),
      // Activo cuenta; inactivo no.
      db().collection("products").add({ activo: true, variantesBajoMinimo: 2 }),
      db().collection("products").add({ activo: true, variantesBajoMinimo: 1 }),
      db().collection("products").add({ activo: false, variantesBajoMinimo: 5 }),
    ]);

    await factura("emitida", 100_000, 40_000, new Date("2026-09-10T15:00:00Z"));
    await factura("pagada", 50_000, 0, new Date("2026-09-15T15:00:00Z"));
    // Anulada: no cuenta en ingresos ni en lo que falta por cobrar.
    await factura("anulada", 999_000, 0, new Date("2026-09-12T15:00:00Z"));
    await factura("pagada", 80_000, 0, new Date("2026-08-20T15:00:00Z"));
  });

  it("cuenta pedidos, suma lo facturado del mes y deja fuera lo anulado", async () => {
    const resumen = await recalcularResumen(AHORA);
    expect(resumen).toMatchObject({
      pedidosNuevos: 2,
      pedidosEnProduccion: 1,
      porCobrar: 40_000,
      ingresosMes: 150_000,
      ingresosMesAnterior: 80_000,
      variantesBajoMinimo: 3,
    });
  });

  it("lo guarda en stats/resumen y lo reutiliza mientras esté fresco", async () => {
    await recalcularResumen(AHORA);
    await db().collection("orders").add({ estado: "recibido" });

    // Un minuto después: se sirve lo guardado, sin volver a contar.
    const guardado = await leerResumen({}, new Date(AHORA.getTime() + 60_000));
    expect(guardado.pedidosNuevos).toBe(2);

    // Forzando, cuenta otra vez.
    expect((await leerResumen({ forzar: true }, AHORA)).pedidosNuevos).toBe(3);
  });

  it("recalcula solo si el guardado ya está viejo", async () => {
    await recalcularResumen(AHORA);
    await db().collection("orders").add({ estado: "en_produccion" });
    const viejo = await leerResumen({}, new Date(AHORA.getTime() + 11 * 60_000));
    expect(viejo.pedidosEnProduccion).toBe(2);
  });
});
