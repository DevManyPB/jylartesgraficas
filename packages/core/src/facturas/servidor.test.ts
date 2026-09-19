import { beforeAll, beforeEach, describe, expect, it } from "vitest";

/**
 * Contra el emulador, como las pruebas de inventario: las variables se fijan
 * antes de importar los módulos que llaman a `getFirebaseAdmin()`.
 */
process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS = "true";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "jyl-facturas-test";

const { getFirebaseAdmin } = await import("../firebase/admin");
const inventario = await import("../inventario/servidor");
const facturas = await import("./servidor");
const { anioEnColombia } = await import("../pedidos/numeracion");

const db = () => getFirebaseAdmin().db;
const autor = "admin-de-prueba";
const anio = anioEnColombia(new Date());

async function variante(stockInicial: number) {
  const productId = await inventario.crearProducto({
    nombre: `Taza ${Math.random().toString(36).slice(2, 8)}`,
    categoria: "Tazas",
    descripcion: "",
    proveedor: "",
    permitePersonalizacion: false,
    activo: true,
    imagenes: [],
  });
  const variantId = await inventario.crearVariante(
    productId,
    { talla: "", color: "Blanca", sku: "", stockMinimo: 1, costoUnitario: null, precioVenta: 20000, activo: true, stockInicial },
    autor,
  );
  return { productId, variantId: variantId! };
}

async function stockDe(productId: string) {
  const p = await inventario.leerProducto(productId);
  return { variante: p!.variantes[0]!.stock, total: p!.stockTotal };
}

async function borrador(lineas: Parameters<typeof facturas.crearBorrador>[0]["lineas"]) {
  const r = await facturas.crearBorrador(
    { orderId: null, clienteDatos: { nombre: "Ana Pérez", documento: "", email: "", telefono: "", direccion: "", ciudad: "" }, lineas, vencimientoEn: null },
    autor,
  );
  if (!r.ok) throw new Error(r.mensaje);
  return r.id;
}

const libre = (precioUnitario: number, cantidad = 1) => ({
  descripcion: "Diseño de logo",
  cantidad,
  precioUnitario,
  descuento: 0,
  productId: null,
  variantId: null,
});

describe("facturas contra el emulador", () => {
  beforeAll(async () => {
    await Promise.all(["invoices", "products", "counters"].map((c) => db().recursiveDelete(db().collection(c))));
  });

  beforeEach(async () => {
    await db().collection("settings").doc("general").set({
      emisor: { razonSocial: "JYL Artes Gráficos", nit: "900.000.000-0", direccion: "" },
      impuestoPorcentaje: 19,
    });
  });

  it("emitir asigna el consecutivo, congela el emisor y recalcula con el impuesto", async () => {
    const id = await borrador([libre(100_000)]);
    const r = await facturas.emitirFactura(id, autor);
    expect(r.ok).toBe(true);

    const f = await facturas.leerFactura(id);
    expect(f).toMatchObject({ estado: "emitida", subtotal: 100_000, impuesto: 19_000, total: 119_000, impuestoPorcentaje: 19 });
    expect(f!.numero).toMatch(new RegExp(`^FAC-${anio}-\\d{4}$`));
    expect(f!.emisor?.razonSocial).toBe("JYL Artes Gráficos");

    // Cambiar la configuración después no toca la factura emitida.
    await db().collection("settings").doc("general").set({ emisor: { razonSocial: "Otro", nit: "1" }, impuestoPorcentaje: 0 });
    expect(await facturas.leerFactura(id)).toMatchObject({ total: 119_000, impuestoPorcentaje: 19 });
  });

  it("no emite sin impuesto configurado, y no consume número", async () => {
    await db().collection("settings").doc("general").set({ emisor: { razonSocial: "JYL", nit: "1" }, impuestoPorcentaje: null });
    const antes = (await db().collection("counters").doc(String(anio)).get()).data()?.invoices ?? 0;
    const r = await facturas.emitirFactura(await borrador([libre(1000)]), autor);
    expect(r.ok).toBe(false);
    const despues = (await db().collection("counters").doc(String(anio)).get()).data()?.invoices ?? 0;
    expect(despues).toBe(antes);
  });

  it("emitir descuenta el stock de las líneas vinculadas, y anular lo devuelve", async () => {
    const { productId, variantId } = await variante(5);
    const linea = { descripcion: "Taza blanca", cantidad: 2, precioUnitario: 20_000, descuento: 0, productId, variantId };
    // Dos líneas de la misma variante: se suman.
    const id = await borrador([linea, { ...linea, cantidad: 1 }, libre(5_000)]);

    expect((await facturas.emitirFactura(id, autor)).ok).toBe(true);
    expect(await stockDe(productId)).toEqual({ variante: 2, total: 2 });
    expect((await facturas.leerFactura(id))!.stockDescontado).toBe(true);

    expect((await facturas.anularFactura(id, "Error en el precio", autor)).ok).toBe(true);
    expect(await stockDe(productId)).toEqual({ variante: 5, total: 5 });
    const f = await facturas.leerFactura(id);
    expect(f).toMatchObject({ estado: "anulada", anulacion: { motivo: "Error en el precio" } });
    // El número queda: anulada, no borrada.
    expect(f!.numero).not.toBeNull();
  });

  it("sin stock suficiente no emite, no descuenta nada y no consume número", async () => {
    const { productId, variantId } = await variante(1);
    const id = await borrador([{ descripcion: "Taza", cantidad: 3, precioUnitario: 20_000, descuento: 0, productId, variantId }]);
    const antes = (await db().collection("counters").doc(String(anio)).get()).data()?.invoices ?? 0;

    const r = await facturas.emitirFactura(id, autor);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.mensaje).toContain("Solo quedan 1");
    expect(await stockDe(productId)).toEqual({ variante: 1, total: 1 });
    expect((await facturas.leerFactura(id))!.estado).toBe("borrador");
    expect((await db().collection("counters").doc(String(anio)).get()).data()?.invoices ?? 0).toBe(antes);
  });

  it("una emitida no se edita ni se borra", async () => {
    const id = await borrador([libre(1000)]);
    await facturas.emitirFactura(id, autor);
    const datos = { orderId: null, clienteDatos: { nombre: "Otro", documento: "", email: "", telefono: "", direccion: "", ciudad: "" }, lineas: [libre(1)], vencimientoEn: null };
    expect((await facturas.actualizarBorrador(id, datos)).ok).toBe(false);
    expect((await facturas.eliminarBorrador(id)).ok).toBe(false);
  });

  it("los pagos parciales dejan saldo; al completar pasa a pagada; no acepta pagar de más", async () => {
    const id = await borrador([libre(100_000)]); // 119.000 con impuesto
    await facturas.emitirFactura(id, autor);

    const primero = await facturas.registrarPago(id, { fecha: "2026-09-19", monto: 50_000, metodo: "nequi" }, autor);
    expect(primero).toEqual({ ok: true, saldo: 69_000 });
    expect((await facturas.registrarPago(id, { fecha: "2026-09-19", monto: 70_000, metodo: "efectivo" }, autor)).ok).toBe(false);

    const segundo = await facturas.registrarPago(id, { fecha: "2026-09-20", monto: 69_000, metodo: "efectivo" }, autor);
    expect(segundo).toEqual({ ok: true, saldo: 0 });
    const f = await facturas.leerFactura(id);
    expect(f).toMatchObject({ estado: "pagada", saldo: 0 });
    expect(f!.pagos).toHaveLength(2);
  });

  /** SPEC.md §6.5: consecutivo sin huecos, aunque se emitan varias a la vez. */
  it("cinco emisiones a la vez dan cinco números seguidos, sin repetir", async () => {
    const ids = await Promise.all(Array.from({ length: 5 }, () => borrador([libre(1000)])));
    const resultados = await Promise.all(ids.map((id) => facturas.emitirFactura(id, autor)));
    const numeros = resultados.map((r) => (r.ok ? Number(r.numero.split("-")[2]) : NaN)).sort((a, b) => a - b);
    expect(numeros.every(Number.isInteger)).toBe(true);
    expect(new Set(numeros).size).toBe(5);
    expect(numeros.at(-1)! - numeros[0]!).toBe(4);
  });
});
