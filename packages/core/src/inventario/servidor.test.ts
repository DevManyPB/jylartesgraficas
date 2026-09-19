import { beforeAll, describe, expect, it } from "vitest";

/**
 * Contra el emulador. El módulo de inventario usa `getFirebaseAdmin()`, que
 * se configura con estas variables; se fijan antes de importarlo.
 */
process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS = "true";
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = "jyl-inventario-test";

const { getFirebaseAdmin } = await import("../firebase/admin");
const inventario = await import("./servidor");

const autor = "operador-de-prueba";

async function productoConVariante(stockInicial: number, precio = 30000) {
  const productId = await inventario.crearProducto({
    nombre: `Camiseta ${Math.random().toString(36).slice(2, 8)}`,
    categoria: "Camisetas",
    descripcion: "",
    proveedor: "",
    permitePersonalizacion: true,
    activo: true,
    imagenes: [],
  });
  const variantId = await inventario.crearVariante(
    productId,
    { talla: "M", color: "Negra", sku: "", stockMinimo: 2, costoUnitario: 12000, precioVenta: precio, activo: true, stockInicial },
    autor,
  );
  return { productId, variantId: variantId! };
}

describe("inventario contra el emulador", () => {
  beforeAll(async () => {
    await getFirebaseAdmin().db.recursiveDelete(getFirebaseAdmin().db.collection("products"));
  });

  it("crear una variante con stock inicial deja su entrada en el historial y los agregados al día", async () => {
    const { productId } = await productoConVariante(5);
    const producto = await inventario.leerProducto(productId);
    expect(producto).toMatchObject({ stockTotal: 5, precioDesde: 30000, precioHasta: 30000, variantesBajoMinimo: 0 });

    const movimientos = await inventario.movimientosDeProducto(productId, producto!.variantes);
    expect(movimientos).toHaveLength(1);
    expect(movimientos[0]).toMatchObject({ tipo: "entrada", delta: 5, stockAnterior: 0, stockNuevo: 5 });
  });

  it("una salida que deja el stock en el mínimo marca la variante como bajo mínimo", async () => {
    const { productId, variantId } = await productoConVariante(5);
    const r = await inventario.registrarMovimientoVariante(productId, variantId, { tipo: "salida", cantidad: 3, motivo: "Venta en el local" }, autor);
    expect(r).toEqual({ ok: true, stockNuevo: 2 });
    expect(await inventario.leerProducto(productId)).toMatchObject({ stockTotal: 2, variantesBajoMinimo: 1 });
  });

  it("no deja sacar más de lo que hay ni escribe nada al rechazarlo", async () => {
    const { productId, variantId } = await productoConVariante(1);
    const r = await inventario.registrarMovimientoVariante(productId, variantId, { tipo: "salida", cantidad: 2, motivo: "Venta" }, autor);
    expect(r.ok).toBe(false);
    const producto = await inventario.leerProducto(productId);
    expect(producto?.variantes[0]?.stock).toBe(1);
    expect(await inventario.movimientosDeProducto(productId, producto!.variantes)).toHaveLength(1);
  });

  /**
   * SPEC.md §13: "Registrar una salida de inventario descuenta el stock
   * correctamente con dos operadores actuando a la vez." Aquí son diez a la
   * vez sobre ocho unidades: tienen que salir exactamente ocho, rechazarse
   * dos, y el stock, el historial y el agregado del producto tienen que
   * cuadrar entre sí.
   */
  it("con diez salidas simultáneas sobre ocho unidades, salen ocho y el inventario cuadra", async () => {
    const { productId, variantId } = await productoConVariante(8);

    const resultados = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        inventario.registrarMovimientoVariante(productId, variantId, { tipo: "salida", cantidad: 1, motivo: `Venta ${i + 1}` }, autor),
      ),
    );

    expect(resultados.filter((r) => r.ok)).toHaveLength(8);
    expect(resultados.filter((r) => !r.ok)).toHaveLength(2);

    const producto = await inventario.leerProducto(productId);
    expect(producto?.variantes[0]?.stock).toBe(0);
    expect(producto?.stockTotal).toBe(0);

    const movimientos = await inventario.movimientosDeProducto(productId, producto!.variantes);
    const salidas = movimientos.filter((m) => m.tipo === "salida");
    expect(salidas).toHaveLength(8);
    // Cada salida partió del stock que dejó la anterior: ninguna leyó un valor viejo.
    expect(salidas.map((m) => m.stockAnterior).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("el rango de precios cubre todas las variantes activas", async () => {
    const { productId } = await productoConVariante(3, 25000);
    await inventario.crearVariante(
      productId,
      { talla: "XL", color: "Negra", sku: "", stockMinimo: 0, costoUnitario: null, precioVenta: 32000, activo: true, stockInicial: 0 },
      autor,
    );
    expect(await inventario.leerProducto(productId)).toMatchObject({ precioDesde: 25000, precioHasta: 32000, stockTotal: 3 });
  });

  it("mover un producto intercambia su lugar con el vecino", async () => {
    const a = await productoConVariante(0);
    const b = await productoConVariante(0);
    const antesA = (await inventario.leerProducto(a.productId))!.orden;
    const antesB = (await inventario.leerProducto(b.productId))!.orden;
    expect(await inventario.moverProducto(b.productId, -1)).toBe(true);
    expect((await inventario.leerProducto(a.productId))!.orden).toBe(antesB);
    expect((await inventario.leerProducto(b.productId))!.orden).toBe(antesA);
  });
});
