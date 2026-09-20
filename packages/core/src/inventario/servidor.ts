import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Transaction,
} from "firebase-admin/firestore";
import {
  aImagenes,
  borrarImagenes,
  borrarImagenesSobrantes,
  ErrorDeCatalogo,
  resolverImagenes,
} from "../catalogo/imagenes";
import { idYOrdenNuevos, moverEnColeccion, reordenarEnColeccion } from "../catalogo/orden";
import { getFirebaseAdmin } from "../firebase/admin";
import type {
  InsumoEditable,
  Movimiento,
  ProductoEditable,
  VarianteEditable,
} from "./esquemas";
import { calcularMovimiento, estadoDeStock, TIPOS_MOVIMIENTO, type TipoMovimiento } from "./stock";
import {
  nombreDeVariante,
  type InsumoDelPanel,
  type MovimientoDelPanel,
  type ProductoConVariantes,
  type ProductoDelPanel,
  type VarianteDelPanel,
  type VarianteParaVender,
} from "./tipos";

export const PRODUCTOS_POR_PAGINA = 25;

/**
 * Intentos de una transacción de stock. Firestore reintenta sola cuando dos
 * escrituras chocan sobre la misma variante; por defecto se rinde a los cinco,
 * y con varias personas moviendo la misma variante a la vez eso deja a
 * alguien con un error que se habría resuelto esperando un momento. Fallar
 * nunca descuadra nada (la transacción que falla no escribe), pero no hace
 * falta que falle.
 */
export const INTENTOS_DE_STOCK = { maxAttempts: 20 };

const db = () => getFirebaseAdmin().db;
const productos = () => db().collection("products");
const insumos = () => db().collection("supplies");

const num = (v: unknown, porDefecto = 0) => (typeof v === "number" && Number.isFinite(v) ? v : porDefecto);
const numONulo = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const txt = (v: unknown) => (typeof v === "string" ? v : "");
const iso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null);

/** Se mantiene el nombre por claridad en las rutas de inventario. */
export const ErrorDeInventario = ErrorDeCatalogo;

// ---------------------------------------------------------------------------
// Lectura

function aProducto(id: string, d: DocumentData): ProductoDelPanel {
  return {
    id,
    nombre: txt(d.nombre),
    categoria: txt(d.categoria),
    descripcion: txt(d.descripcion),
    proveedor: txt(d.proveedor),
    permitePersonalizacion: d.permitePersonalizacion === true,
    activo: d.activo === true,
    orden: num(d.orden),
    imagenes: aImagenes(d.imagenes),
    stockTotal: num(d.stockTotal),
    precioDesde: numONulo(d.precioDesde),
    precioHasta: numONulo(d.precioHasta),
    variantesBajoMinimo: num(d.variantesBajoMinimo),
  };
}

function aVariante(id: string, d: DocumentData): VarianteDelPanel {
  return {
    id,
    talla: txt(d.talla),
    color: txt(d.color),
    sku: txt(d.sku),
    stock: num(d.stock),
    stockMinimo: num(d.stockMinimo),
    costoUnitario: numONulo(d.costoUnitario),
    precioVenta: num(d.precioVenta),
    activo: d.activo !== false,
  };
}

export async function listarProductos(despuesDe?: string): Promise<{ filas: ProductoDelPanel[]; siguiente: string | null }> {
  let consulta = productos().orderBy("orden");
  if (despuesDe) {
    const cursor = await productos().doc(despuesDe).get();
    if (cursor.exists) consulta = consulta.startAfter(cursor);
  }
  const r = await consulta.limit(PRODUCTOS_POR_PAGINA + 1).get();
  const docs = r.docs.slice(0, PRODUCTOS_POR_PAGINA);
  return {
    filas: docs.map((d) => aProducto(d.id, d.data())),
    siguiente: r.docs.length > PRODUCTOS_POR_PAGINA ? (docs.at(-1)?.id ?? null) : null,
  };
}

export async function leerProducto(id: string): Promise<ProductoConVariantes | null> {
  const referencia = productos().doc(id);
  const [documento, variantes] = await Promise.all([
    referencia.get(),
    referencia.collection("variants").orderBy("orden").get(),
  ]);
  if (!documento.exists) return null;
  return {
    ...aProducto(documento.id, documento.data()!),
    variantes: variantes.docs.map((v) => aVariante(v.id, v.data())),
  };
}

// ---------------------------------------------------------------------------
// Agregados del producto

/**
 * Recalcula lo que el producto muestra de sus variantes: stock total, rango
 * de precios y cuántas están bajo mínimo, a partir de todas las variantes.
 * Se usa al crear o editar una variante, que puede cambiar precios y mínimos.
 * Los movimientos, que solo cambian stock, ajustan por diferencia (ver
 * `registrarMovimientoVariante`); los dos caminos van en transacción.
 *
 * `cambios` son las variantes que la transacción está escribiendo, que aún no
 * se ven al leer.
 */
async function recalcularProducto(
  tx: Transaction,
  producto: DocumentReference,
  variantes: FirebaseFirestore.QuerySnapshot,
  cambios: Map<string, Partial<VarianteDelPanel>> = new Map(),
): Promise<void> {
  const todas = variantes.docs.map((d) => ({ ...aVariante(d.id, d.data()), ...cambios.get(d.id) }));
  for (const [id, cambio] of cambios) {
    if (!todas.some((v) => v.id === id)) todas.push({ ...aVariante(id, {}), ...cambio });
  }
  const activas = todas.filter((v) => v.activo);
  const precios = activas.map((v) => v.precioVenta);

  tx.update(producto, {
    stockTotal: activas.reduce((suma, v) => suma + v.stock, 0),
    precioDesde: precios.length ? Math.min(...precios) : null,
    precioHasta: precios.length ? Math.max(...precios) : null,
    variantesBajoMinimo: activas.filter((v) => estadoDeStock(v.stock, v.stockMinimo) !== "ok").length,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Productos

export async function crearProducto(datos: ProductoEditable): Promise<string> {
  const imagenes = await resolverImagenes(datos.imagenes, []);

  return db().runTransaction(async (tx) => {
    const { id, orden } = await idYOrdenNuevos(tx, productos(), datos.nombre, "producto");

    tx.set(productos().doc(id), {
      ...datos,
      imagenes,
      slug: id,
      orden,
      stockTotal: 0,
      precioDesde: null,
      precioHasta: null,
      variantesBajoMinimo: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return id;
  });
}

export async function actualizarProducto(id: string, datos: ProductoEditable): Promise<boolean> {
  const referencia = productos().doc(id);
  const documento = await referencia.get();
  if (!documento.exists) return false;

  const antes = aImagenes(documento.data()!.imagenes);
  const imagenes = await resolverImagenes(datos.imagenes, antes);
  await referencia.update({ ...datos, imagenes, updatedAt: FieldValue.serverTimestamp() });
  await borrarImagenesSobrantes(antes, imagenes);
  return true;
}

/**
 * Sube o baja un producto un puesto, intercambiando `orden` con el vecino en
 * una transacción. No necesita la lista completa, así que funciona igual
 * aunque el vecino esté en otra página.
 */
export async function moverProducto(id: string, direccion: -1 | 1): Promise<boolean> {
  return moverEnColeccion(productos(), id, direccion);
}

/** Aplica el orden de los productos que se ven en pantalla, tras arrastrar. */
export async function reordenarProductos(ids: string[]): Promise<boolean> {
  return reordenarEnColeccion(productos(), ids);
}

/**
 * Elimina el producto con sus variantes y su historial de movimientos, y sus
 * fotos de Cloudinary. Los pedidos viejos no se rompen: guardan nombre, talla
 * y color de lo que se pidió, no solo el id.
 */
export async function eliminarProducto(id: string): Promise<boolean> {
  const referencia = productos().doc(id);
  const documento = await referencia.get();
  if (!documento.exists) return false;
  const imagenes = aImagenes(documento.data()!.imagenes);

  await db().recursiveDelete(referencia);
  await borrarImagenes(imagenes);
  return true;
}

// ---------------------------------------------------------------------------
// Variantes

function movimientoInicial(productId: string, variantId: string, cantidad: number, autorUid: string) {
  return {
    tipo: "entrada" as TipoMovimiento,
    cantidad,
    delta: cantidad,
    stockAnterior: 0,
    stockNuevo: cantidad,
    motivo: "Stock inicial al crear la variante",
    productId,
    variantId,
    orderId: null,
    autorUid,
    createdAt: FieldValue.serverTimestamp(),
  };
}

export async function crearVariante(
  productId: string,
  datos: VarianteEditable & { stockInicial: number },
  autorUid: string,
): Promise<string | null> {
  const producto = productos().doc(productId);
  const { stockInicial, ...variante } = datos;

  return db().runTransaction(async (tx) => {
    // Crear o editar una variante cambia precios y mínimos: los agregados se
    // recalculan con todas. Es cosa del admin y ocasional; el camino
    // concurrido, el de los movimientos, lee solo lo que necesita.
    const documento = await tx.get(producto);
    const variantes = await tx.get(producto.collection("variants"));
    if (!documento.exists) return null;

    const referencia = producto.collection("variants").doc();
    const orden = variantes.docs.reduce((max, v) => Math.max(max, num(v.data().orden)), -1) + 1;
    tx.set(referencia, { ...variante, stock: stockInicial, orden, createdAt: FieldValue.serverTimestamp() });
    if (stockInicial > 0) {
      tx.set(referencia.collection("movements").doc(), movimientoInicial(productId, referencia.id, stockInicial, autorUid));
    }

    await recalcularProducto(tx, producto, variantes, new Map([[referencia.id, { ...variante, stock: stockInicial }]]));
    return referencia.id;
  }, INTENTOS_DE_STOCK);
}

export async function actualizarVariante(productId: string, variantId: string, datos: VarianteEditable): Promise<boolean> {
  const producto = productos().doc(productId);
  const referencia = producto.collection("variants").doc(variantId);

  return db().runTransaction(async (tx) => {
    // Crear o editar una variante cambia precios y mínimos: los agregados se
    // recalculan con todas. Es cosa del admin y ocasional; el camino
    // concurrido, el de los movimientos, lee solo lo que necesita.
    const documento = await tx.get(referencia);
    const variantes = await tx.get(producto.collection("variants"));
    if (!documento.exists) return false;
    // `datos` no trae stock: el esquema no lo admite, y aquí no se toca.
    tx.update(referencia, { ...datos });
    await recalcularProducto(tx, producto, variantes, new Map([[variantId, datos]]));
    return true;
  }, INTENTOS_DE_STOCK);
}

// ---------------------------------------------------------------------------
// Movimientos

export type ResultadoRegistro = { ok: true; stockNuevo: number } | { ok: false; mensaje: string };

/**
 * Registra un movimiento de una variante — SPEC.md §6.4. Lee el stock,
 * calcula, escribe el movimiento, el stock nuevo y los agregados del producto,
 * todo en una transacción: si dos personas registran a la vez, Firestore
 * repite la que llegó segunda con el stock ya actualizado, y ninguna de las
 * dos puede descuadrar el inventario.
 *
 * Lee solo la variante y el producto, y en una única llamada (`getAll`). Un
 * movimiento no cambia precios, solo stock, así que los agregados se ajustan
 * por diferencia en la misma transacción, y siguen siendo exactos. Leer
 * además todas las variantes bloqueaba más documentos de los necesarios y,
 * con varias personas a la vez, el emulador cerraba la transacción entre la
 * primera y la segunda lectura con un error que Firestore no reintenta.
 */
export async function registrarMovimientoVariante(
  productId: string,
  variantId: string,
  movimiento: Movimiento,
  autorUid: string,
  orderId: string | null = null,
): Promise<ResultadoRegistro> {
  const producto = productos().doc(productId);
  const referencia = producto.collection("variants").doc(variantId);

  return db().runTransaction(async (tx) => {
    const [documento, documentoProducto] = await tx.getAll(referencia, producto);
    if (!documento?.exists || !documentoProducto?.exists) {
      return { ok: false, mensaje: "Esa variante ya no existe." };
    }

    const variante = aVariante(documento.id, documento.data()!);
    const calculo = calcularMovimiento(variante.stock, movimiento.tipo, movimiento.cantidad);
    if (!calculo.ok) return calculo;
    const stockAnterior = variante.stock;

    tx.update(referencia, { stock: calculo.stockNuevo });

    // Una variante oculta no cuenta en lo que muestra el producto.
    if (variante.activo) {
      const antes = estadoDeStock(stockAnterior, variante.stockMinimo) !== "ok" ? 1 : 0;
      const despues = estadoDeStock(calculo.stockNuevo, variante.stockMinimo) !== "ok" ? 1 : 0;
      tx.update(producto, {
        stockTotal: FieldValue.increment(calculo.delta),
        variantesBajoMinimo: FieldValue.increment(despues - antes),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    tx.set(referencia.collection("movements").doc(), {
      ...movimiento,
      delta: calculo.delta,
      stockAnterior,
      stockNuevo: calculo.stockNuevo,
      productId,
      variantId,
      orderId,
      autorUid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, stockNuevo: calculo.stockNuevo };
  }, INTENTOS_DE_STOCK);
}

/** Referencias de una variante y su producto, para leerlas dentro de una transacción. */
export function referenciasDeVariante(productId: string, variantId: string) {
  const producto = productos().doc(productId);
  return { producto, variante: producto.collection("variants").doc(variantId) };
}

export interface MovimientoEnLote {
  productId: string;
  variantId: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  /** Cómo se llama la línea, para el mensaje si no se puede mover. */
  nombre: string;
}

export type PlanDeMovimientos =
  | { ok: true; aplicar: (tx: Transaction) => void }
  | { ok: false; mensaje: string };

/**
 * Varios movimientos de stock que deben ir juntos o no ir — p. ej. las líneas
 * de una factura (SPEC.md §6.4: facturar descuenta el stock).
 *
 * Quien llama lee las variantes y los productos con un solo `tx.getAll` (ver
 * `registrarMovimientoVariante` sobre por qué una sola lectura) y pasa aquí
 * lo leído. Si algún movimiento no cabe, no se escribe ninguno. Los
 * agregados del producto se ajustan por diferencia, sumados por producto.
 * Cada variante aparece una sola vez: quien llama suma antes las líneas que
 * la repiten.
 */
export function planDeMovimientos(
  movimientos: readonly MovimientoEnLote[],
  leido: (ref: DocumentReference) => FirebaseFirestore.DocumentSnapshot | undefined,
  autorUid: string,
  orderId: string | null,
): PlanDeMovimientos {
  const escrituras: ((tx: Transaction) => void)[] = [];
  const porProducto = new Map<string, { ref: DocumentReference; delta: number; bajoMinimo: number }>();

  for (const m of movimientos) {
    const { producto, variante } = referenciasDeVariante(m.productId, m.variantId);
    const documento = leido(variante);
    if (!documento?.exists || !leido(producto)?.exists) {
      return { ok: false, mensaje: `«${m.nombre}» ya no está en el inventario. Quita el vínculo de esa línea.` };
    }
    const v = aVariante(documento.id, documento.data()!);
    const calculo = calcularMovimiento(v.stock, m.tipo, m.cantidad);
    if (!calculo.ok) return { ok: false, mensaje: `«${m.nombre}»: ${calculo.mensaje}` };

    escrituras.push((tx) => {
      tx.update(variante, { stock: calculo.stockNuevo });
      tx.set(variante.collection("movements").doc(), {
        tipo: m.tipo,
        cantidad: m.cantidad,
        motivo: m.motivo,
        delta: calculo.delta,
        stockAnterior: v.stock,
        stockNuevo: calculo.stockNuevo,
        productId: m.productId,
        variantId: m.variantId,
        orderId,
        autorUid,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    if (v.activo) {
      const agregado = porProducto.get(m.productId) ?? { ref: producto, delta: 0, bajoMinimo: 0 };
      agregado.delta += calculo.delta;
      agregado.bajoMinimo +=
        (estadoDeStock(calculo.stockNuevo, v.stockMinimo) !== "ok" ? 1 : 0) -
        (estadoDeStock(v.stock, v.stockMinimo) !== "ok" ? 1 : 0);
      porProducto.set(m.productId, agregado);
    }
  }

  return {
    ok: true,
    aplicar: (tx) => {
      for (const escribir of escrituras) escribir(tx);
      for (const { ref, delta, bajoMinimo } of porProducto.values()) {
        tx.update(ref, {
          stockTotal: FieldValue.increment(delta),
          variantesBajoMinimo: FieldValue.increment(bajoMinimo),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    },
  };
}

async function nombresDeAutores(uids: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(uids.filter(Boolean))];
  if (unicos.length === 0) return new Map();
  const { users } = await getFirebaseAdmin().auth.getUsers(unicos.map((uid) => ({ uid })));
  return new Map(users.map((u) => [u.uid, u.displayName || u.email || "Alguien del estudio"]));
}

async function aMovimientos(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  nombreDe: (d: DocumentData) => string,
): Promise<MovimientoDelPanel[]> {
  const autores = await nombresDeAutores(docs.map((d) => txt(d.data().autorUid)));
  return docs.map((m) => {
    const d = m.data();
    const tipo = (TIPOS_MOVIMIENTO as readonly string[]).includes(d.tipo) ? (d.tipo as TipoMovimiento) : "ajuste";
    return {
      id: m.id,
      tipo,
      cantidad: num(d.cantidad),
      delta: num(d.delta),
      stockAnterior: num(d.stockAnterior),
      stockNuevo: num(d.stockNuevo),
      motivo: txt(d.motivo),
      de: nombreDe(d),
      autor: autores.get(txt(d.autorUid)) ?? null,
      orderId: typeof d.orderId === "string" ? d.orderId : null,
      creadoEn: iso(d.createdAt),
    };
  });
}

/** Los últimos movimientos de todas las variantes de un producto. */
export async function movimientosDeProducto(productId: string, variantes: VarianteDelPanel[]): Promise<MovimientoDelPanel[]> {
  const r = await db()
    .collectionGroup("movements")
    .where("productId", "==", productId)
    .orderBy("createdAt", "desc")
    .limit(25)
    .get();
  const nombres = new Map(variantes.map((v) => [v.id, nombreDeVariante(v)]));
  return aMovimientos(r.docs, (d) => nombres.get(txt(d.variantId)) ?? "Variante eliminada");
}

// ---------------------------------------------------------------------------
// Insumos — SPEC.md §6.4: mismas reglas que los productos.

function aInsumo(id: string, d: DocumentData): InsumoDelPanel {
  return {
    id,
    nombre: txt(d.nombre),
    sku: txt(d.sku),
    unidad: txt(d.unidad),
    stock: num(d.stock),
    stockMinimo: num(d.stockMinimo),
    costoUnitario: numONulo(d.costoUnitario),
    proveedor: txt(d.proveedor),
  };
}

export async function listarInsumos(despuesDe?: string): Promise<{ filas: InsumoDelPanel[]; siguiente: string | null }> {
  let consulta = insumos().orderBy("nombre");
  if (despuesDe) {
    const cursor = await insumos().doc(despuesDe).get();
    if (cursor.exists) consulta = consulta.startAfter(cursor);
  }
  const r = await consulta.limit(PRODUCTOS_POR_PAGINA + 1).get();
  const docs = r.docs.slice(0, PRODUCTOS_POR_PAGINA);
  return {
    filas: docs.map((d) => aInsumo(d.id, d.data())),
    siguiente: r.docs.length > PRODUCTOS_POR_PAGINA ? (docs.at(-1)?.id ?? null) : null,
  };
}

export async function leerInsumo(id: string): Promise<InsumoDelPanel | null> {
  const d = await insumos().doc(id).get();
  return d.exists ? aInsumo(d.id, d.data()!) : null;
}

export async function crearInsumo(datos: InsumoEditable, stockInicial: number, autorUid: string): Promise<string> {
  const referencia = insumos().doc();
  const lote = db().batch();
  lote.set(referencia, { ...datos, stock: stockInicial, createdAt: FieldValue.serverTimestamp() });
  if (stockInicial > 0) {
    lote.set(referencia.collection("movements").doc(), {
      tipo: "entrada",
      cantidad: stockInicial,
      delta: stockInicial,
      stockAnterior: 0,
      stockNuevo: stockInicial,
      motivo: "Stock inicial al crear el insumo",
      insumoId: referencia.id,
      orderId: null,
      autorUid,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  await lote.commit();
  return referencia.id;
}

export async function actualizarInsumo(id: string, datos: InsumoEditable): Promise<boolean> {
  const referencia = insumos().doc(id);
  if (!(await referencia.get()).exists) return false;
  await referencia.update({ ...datos, updatedAt: FieldValue.serverTimestamp() });
  return true;
}

export async function registrarMovimientoInsumo(
  id: string,
  movimiento: Movimiento,
  autorUid: string,
): Promise<ResultadoRegistro> {
  const referencia = insumos().doc(id);
  return db().runTransaction(async (tx) => {
    const documento = await tx.get(referencia);
    if (!documento.exists) return { ok: false, mensaje: "Ese insumo ya no existe." };

    const stockAnterior = num(documento.data()!.stock);
    const calculo = calcularMovimiento(stockAnterior, movimiento.tipo, movimiento.cantidad);
    if (!calculo.ok) return calculo;

    tx.update(referencia, { stock: calculo.stockNuevo, updatedAt: FieldValue.serverTimestamp() });
    tx.set(referencia.collection("movements").doc(), {
      ...movimiento,
      delta: calculo.delta,
      stockAnterior,
      stockNuevo: calculo.stockNuevo,
      insumoId: id,
      orderId: null,
      autorUid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, stockNuevo: calculo.stockNuevo };
  }, INTENTOS_DE_STOCK);
}

export async function movimientosDeInsumo(id: string): Promise<MovimientoDelPanel[]> {
  const r = await insumos().doc(id).collection("movements").orderBy("createdAt", "desc").limit(25).get();
  const insumo = await leerInsumo(id);
  return aMovimientos(r.docs, () => insumo?.nombre ?? "");
}

/**
 * Categorías en uso, para sugerirlas al crear un producto. Lee un solo campo
 * de cada producto; se usa solo al abrir el formulario, no en listas.
 */
export async function categoriasDeProductos(): Promise<string[]> {
  const r = await productos().select("categoria").get();
  return [...new Set(r.docs.map((d) => txt(d.data().categoria)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}


/**
 * Todas las variantes activas, para vincularlas a una línea de factura. Dos
 * lecturas (productos y un `collectionGroup` de variantes) en vez de una por
 * producto: el catálogo de un estudio es de decenas o pocos cientos.
 */
export async function variantesParaVender(): Promise<VarianteParaVender[]> {
  const [listaProductos, variantes] = await Promise.all([
    productos().get(),
    db().collectionGroup("variants").get(),
  ]);
  const nombres = new Map(listaProductos.docs.map((p) => [p.id, txt(p.data().nombre)]));

  return variantes.docs
    .filter((v) => v.ref.parent.parent?.parent.id === "products" && nombres.has(v.ref.parent.parent.id))
    .map((v) => {
      const productId = v.ref.parent.parent!.id;
      const variante = aVariante(v.id, v.data());
      return { productId, variante };
    })
    .filter(({ variante }) => variante.activo)
    .map(({ productId, variante }) => ({
      productId,
      variantId: variante.id,
      nombre: [nombres.get(productId), nombreDeVariante(variante)].filter(Boolean).join(" — "),
      sku: variante.sku,
      precioVenta: variante.precioVenta,
      stock: variante.stock,
    }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
