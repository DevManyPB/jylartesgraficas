import "server-only";

import { FieldValue, Timestamp, type DocumentData, type DocumentReference } from "firebase-admin/firestore";
import { CONFIGURACION_VACIA, configuracionSchema } from "../configuracion/esquemas";
import { leerConfiguracion } from "../configuracion/servidor";
import { getFirebaseAdmin } from "../firebase/admin";
import {
  INTENTOS_DE_STOCK,
  planDeMovimientos,
  referenciasDeVariante,
  type MovimientoEnLote,
} from "../inventario/servidor";
import { nombreDeVariante } from "../inventario/tipos";
import { leerPedidoDelPanel } from "../pedidos/panel";
import { anioEnColombia } from "../pedidos/numeracion";
import { calcularTotales, formatearNumeroFactura, saldoPendiente, unidadesPorVariante } from "./calculo";
import {
  ESTADOS_FACTURA,
  METODOS_PAGO,
  type BorradorFactura,
  type BorradorFacturaEntrante,
  type EstadoFactura,
  type LineaFactura,
  type MetodoPago,
  type Pago,
} from "./esquemas";
import type { EmisorFactura, FacturaDelPanel, FilaFactura, PagoDeFactura } from "./tipos";

export const FACTURAS_POR_PAGINA = 25;

const pesosCO = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const db = () => getFirebaseAdmin().db;
const facturas = () => db().collection("invoices");

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const txt = (v: unknown) => (typeof v === "string" ? v : "");
const iso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null);
const estadoDe = (v: unknown): EstadoFactura =>
  (ESTADOS_FACTURA as readonly unknown[]).includes(v) ? (v as EstadoFactura) : "borrador";

/** Un resultado que la Route Handler traduce a respuesta sin adivinar. */
export type Resultado<T = object> = ({ ok: true } & T) | { ok: false; estado: 404 | 409; mensaje: string };

const noExiste = { ok: false, estado: 404, mensaje: "Esa factura ya no existe." } as const;
const conflicto = (mensaje: string) => ({ ok: false, estado: 409, mensaje }) as const;

// ---------------------------------------------------------------------------
// Lectura

function aLineas(v: unknown): LineaFactura[] {
  if (!Array.isArray(v)) return [];
  return v.map((l: DocumentData) => ({
    descripcion: txt(l.descripcion),
    cantidad: num(l.cantidad),
    precioUnitario: num(l.precioUnitario),
    descuento: num(l.descuento),
    productId: typeof l.productId === "string" ? l.productId : null,
    variantId: typeof l.variantId === "string" ? l.variantId : null,
  }));
}

function aPagos(v: unknown, autores: Map<string, string>): PagoDeFactura[] {
  if (!Array.isArray(v)) return [];
  return v.map((p: DocumentData) => ({
    fecha: txt(p.fecha),
    monto: num(p.monto),
    metodo: (METODOS_PAGO as readonly unknown[]).includes(p.metodo) ? (p.metodo as MetodoPago) : "otro",
    registradoPor: autores.get(txt(p.autorUid)) ?? null,
  }));
}

function aFila(id: string, d: DocumentData): FilaFactura {
  const total = num(d.total);
  return {
    id,
    numero: typeof d.numero === "string" ? d.numero : null,
    estado: estadoDe(d.estado),
    cliente: txt(d.clienteDatos?.nombre),
    total,
    saldo:
      d.estado !== "emitida"
        ? 0
        : typeof d.saldo === "number"
          ? d.saldo
          : saldoPendiente(total, aPagos(d.pagos, new Map())),
    creadaEn: iso(d.createdAt),
    emitidaEn: iso(d.emitidaEn),
  };
}

async function nombresDeAutores(uids: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(uids.filter(Boolean))];
  if (unicos.length === 0) return new Map();
  const { users } = await getFirebaseAdmin().auth.getUsers(unicos.map((uid) => ({ uid })));
  return new Map(users.map((u) => [u.uid, u.displayName || u.email || "Alguien del estudio"]));
}

export async function listarFacturas(filtro: {
  estado?: EstadoFactura;
  despuesDe?: string;
}): Promise<{ filas: FilaFactura[]; siguiente: string | null }> {
  let consulta = facturas().orderBy("createdAt", "desc");
  if (filtro.estado) consulta = facturas().where("estado", "==", filtro.estado).orderBy("createdAt", "desc");
  if (filtro.despuesDe) {
    const cursor = await facturas().doc(filtro.despuesDe).get();
    if (cursor.exists) consulta = consulta.startAfter(cursor);
  }
  const r = await consulta.limit(FACTURAS_POR_PAGINA + 1).get();
  const docs = r.docs.slice(0, FACTURAS_POR_PAGINA);
  return {
    filas: docs.map((d) => aFila(d.id, d.data())),
    siguiente: r.docs.length > FACTURAS_POR_PAGINA ? (docs.at(-1)?.id ?? null) : null,
  };
}

/** Las facturas que salieron de un pedido, la más reciente primero. */
export async function facturasDePedido(orderId: string): Promise<FilaFactura[]> {
  const r = await facturas().where("orderId", "==", orderId).get();
  return r.docs
    .map((d) => aFila(d.id, d.data()))
    .sort((a, b) => (b.creadaEn ?? "").localeCompare(a.creadaEn ?? ""));
}

export async function leerFactura(id: string): Promise<FacturaDelPanel | null> {
  const documento = await facturas().doc(id).get();
  if (!documento.exists) return null;
  const d = documento.data()!;

  const pagosCrudos: DocumentData[] = Array.isArray(d.pagos) ? d.pagos : [];
  const [autores, pedido, configuracion] = await Promise.all([
    nombresDeAutores([...pagosCrudos.map((p) => txt(p.autorUid)), txt(d.anulacion?.autorUid)]),
    typeof d.orderId === "string" ? db().collection("orders").doc(d.orderId).get() : null,
    // Un borrador muestra el impuesto vigente; al emitir queda congelado.
    d.estado === "borrador" ? leerConfiguracion() : null,
  ]);

  const pagos = aPagos(d.pagos, autores);
  const fila = aFila(documento.id, d);
  return {
    ...fila,
    orderId: typeof d.orderId === "string" ? d.orderId : null,
    pedidoNumero: pedido?.exists ? txt(pedido.data()!.numero) || null : null,
    clienteUid: typeof d.clienteUid === "string" ? d.clienteUid : null,
    clienteDatos: {
      nombre: txt(d.clienteDatos?.nombre),
      documento: txt(d.clienteDatos?.documento),
      email: txt(d.clienteDatos?.email),
      telefono: txt(d.clienteDatos?.telefono),
      direccion: txt(d.clienteDatos?.direccion),
      ciudad: txt(d.clienteDatos?.ciudad),
    },
    lineas: aLineas(d.lineas),
    subtotal: num(d.subtotal),
    descuento: num(d.descuento),
    impuesto: num(d.impuesto),
    impuestoPorcentaje: configuracion
      ? configuracion.impuestoPorcentaje
      : typeof d.impuestoPorcentaje === "number"
        ? d.impuestoPorcentaje
        : null,
    emisor: d.emisor
      ? {
          razonSocial: txt(d.emisor.razonSocial),
          nit: txt(d.emisor.nit),
          direccion: txt(d.emisor.direccion),
          telefono: txt(d.emisor.telefono),
          email: txt(d.emisor.email),
        }
      : null,
    vencimientoEn: typeof d.vencimientoEn === "string" ? d.vencimientoEn : null,
    pagos,
    anulacion: d.anulacion
      ? {
          motivo: txt(d.anulacion.motivo),
          autor: autores.get(txt(d.anulacion.autorUid)) ?? null,
          fecha: iso(d.anulacion.fecha),
        }
      : null,
    stockDescontado: d.stockDescontado === true,
  };
}

// ---------------------------------------------------------------------------
// Borrador

/**
 * Lo que el formulario de una factura nueva trae ya lleno a partir de un
 * pedido — SPEC.md §1: "la factura sale del pedido, no de cero". No guarda
 * nada: el borrador existe cuando alguien lo guarda.
 *
 * Los productos del pedido llegan vinculados a su variante, con su precio de
 * venta; un servicio llega como una línea con precio en cero, porque el
 * precio de un servicio se cotiza.
 */
export async function borradorDesdePedido(
  orderId: string,
): Promise<{ datos: BorradorFacturaEntrante; pedidoNumero: string } | null> {
  const [pedido, crudo] = await Promise.all([
    leerPedidoDelPanel(orderId),
    db().collection("orders").doc(orderId).get(),
  ]);
  if (!pedido || !crudo.exists) return null;

  const items: DocumentData[] = Array.isArray(crudo.data()!.items) ? crudo.data()!.items : [];
  const vinculados = items.filter((i) => typeof i.productId === "string" && typeof i.variantId === "string");
  const variantes = vinculados.length
    ? await db().getAll(...vinculados.map((i) => referenciasDeVariante(i.productId, i.variantId).variante))
    : [];
  const precios = new Map(variantes.filter((v) => v.exists).map((v) => [v.ref.path, num(v.data()!.precioVenta)]));

  const lineas: BorradorFacturaEntrante["lineas"] = items.map((i) => {
    const vinculado = typeof i.productId === "string" && typeof i.variantId === "string";
    const ruta = vinculado ? referenciasDeVariante(i.productId, i.variantId).variante.path : "";
    const variante = nombreDeVariante({ talla: txt(i.talla), color: txt(i.color) });
    return {
      descripcion: [txt(i.nombre), variante].filter(Boolean).join(" — ") + (i.personalizado ? " (personalizado)" : ""),
      cantidad: Math.max(1, num(i.cantidad)),
      precioUnitario: precios.get(ruta) ?? 0,
      descuento: 0,
      // Si la variante ya no existe, la línea queda libre en vez de vinculada a nada.
      productId: precios.has(ruta) ? i.productId : null,
      variantId: precios.has(ruta) ? i.variantId : null,
    };
  });
  if (lineas.length === 0) {
    lineas.push({
      descripcion: pedido.servicio ? `${pedido.servicio} — pedido ${pedido.numero}` : `Pedido ${pedido.numero}`,
      cantidad: 1,
      precioUnitario: 0,
      descuento: 0,
      productId: null,
      variantId: null,
    });
  }

  return {
    pedidoNumero: pedido.numero,
    datos: {
      orderId,
      clienteDatos: {
        nombre: pedido.contacto.nombre,
        documento: "",
        email: pedido.contacto.email,
        telefono: pedido.contacto.telefono,
        direccion: "",
        ciudad: pedido.contacto.ciudad,
      },
      lineas,
      vencimientoEn: null,
    },
  };
}

/** El cliente con cuenta del pedido, si lo tiene: así ve la factura desde su cuenta. */
async function clienteUidDe(orderId: string | null): Promise<string | null | false> {
  if (!orderId) return null;
  const pedido = await db().collection("orders").doc(orderId).get();
  if (!pedido.exists) return false;
  const uid = pedido.data()!.uid;
  return typeof uid === "string" ? uid : null;
}

export async function crearBorrador(datos: BorradorFactura, autorUid: string): Promise<Resultado<{ id: string }>> {
  const [clienteUid, configuracion] = await Promise.all([clienteUidDe(datos.orderId), leerConfiguracion()]);
  if (clienteUid === false) return conflicto("El pedido de origen ya no existe.");

  const referencia = facturas().doc();
  await referencia.set({
    ...datos,
    ...calcularTotales(datos.lineas, configuracion.impuestoPorcentaje),
    numero: null,
    estado: "borrador",
    saldo: 0,
    clienteUid,
    pagos: [],
    anulacion: null,
    emisor: null,
    impuestoPorcentaje: null,
    stockDescontado: false,
    emitidaEn: null,
    autorUid,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true, id: referencia.id };
}

export async function actualizarBorrador(id: string, datos: BorradorFactura): Promise<Resultado> {
  const [clienteUid, configuracion] = await Promise.all([clienteUidDe(datos.orderId), leerConfiguracion()]);
  if (clienteUid === false) return conflicto("El pedido de origen ya no existe.");
  const referencia = facturas().doc(id);

  return db().runTransaction(async (tx): Promise<Resultado> => {
    const documento = await tx.get(referencia);
    if (!documento.exists) return noExiste;
    if (documento.data()!.estado !== "borrador") {
      return conflicto("Esta factura ya se emitió y no se puede editar. Para corregirla, anúlala y emite otra.");
    }
    tx.update(referencia, {
      ...datos,
      ...calcularTotales(datos.lineas, configuracion.impuestoPorcentaje),
      clienteUid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  });
}

/** Solo un borrador se borra: no tiene número, así que no deja huecos. */
export async function eliminarBorrador(id: string): Promise<Resultado> {
  const referencia = facturas().doc(id);
  return db().runTransaction(async (tx): Promise<Resultado> => {
    const documento = await tx.get(referencia);
    if (!documento.exists) return noExiste;
    if (documento.data()!.estado !== "borrador") {
      return conflicto("Una factura emitida no se borra: se anula, y su número queda registrado.");
    }
    tx.delete(referencia);
    return { ok: true };
  });
}

// ---------------------------------------------------------------------------
// Emitir, anular, pagar

function movimientosDe(lineas: LineaFactura[], tipo: "salida" | "entrada", motivo: string): MovimientoEnLote[] {
  return [...unidadesPorVariante(lineas).values()].map((u) => ({
    ...u,
    tipo,
    motivo,
    nombre: lineas.find((l) => l.variantId === u.variantId && l.productId === u.productId)?.descripcion ?? "Una línea",
  }));
}

function referenciasDeStock(lineas: LineaFactura[]): DocumentReference[] {
  return [...unidadesPorVariante(lineas).values()].flatMap((u) => {
    const { producto, variante } = referenciasDeVariante(u.productId, u.variantId);
    return [variante, producto];
  });
}

const mismaLista = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Emite la factura — SPEC.md §6.5. En una sola transacción:
 * asigna el siguiente consecutivo de `counters/{año}` (sin huecos: si algo
 * falla, no se consume número), congela emisor e impuesto, recalcula los
 * totales y descuenta el stock de las líneas vinculadas a una variante.
 *
 * Las líneas se leen primero fuera de la transacción para saber qué
 * variantes leer dentro, y dentro se comprueba que no hayan cambiado: así la
 * transacción lee todo con un solo `getAll` (ver `registrarMovimientoVariante`).
 */
export async function emitirFactura(id: string, autorUid: string): Promise<Resultado<{ numero: string }>> {
  const referencia = facturas().doc(id);
  const previa = await referencia.get();
  if (!previa.exists) return noExiste;
  const lineasPrevias = aLineas(previa.data()!.lineas);

  const anio = anioEnColombia(new Date());
  const contador = db().collection("counters").doc(String(anio));
  const ajustes = db().collection("settings").doc("general");
  const stock = referenciasDeStock(lineasPrevias);

  return db().runTransaction(async (tx): Promise<Resultado<{ numero: string }>> => {
    const [documento, documentoContador, documentoAjustes, ...leidos] = await tx.getAll(
      referencia,
      contador,
      ajustes,
      ...stock,
    );
    if (!documento?.exists) return noExiste;
    const d = documento.data()!;
    if (d.estado !== "borrador") return conflicto("Esta factura ya se emitió.");
    const lineas = aLineas(d.lineas);
    if (!mismaLista(lineas, lineasPrevias)) return conflicto("Alguien acaba de cambiar la factura. Revísala y vuelve a emitir.");
    if (lineas.length === 0) return conflicto("La factura no tiene líneas.");

    const configuracion = configuracionDe(documentoAjustes);
    if (configuracion.impuestoPorcentaje === null) {
      return conflicto("Falta el porcentaje de impuesto en Configuración (pon 0 si no aplica).");
    }
    if (!configuracion.emisor.razonSocial || !configuracion.emisor.nit) {
      return conflicto("Faltan la razón social o el NIT del estudio en Configuración.");
    }

    const numero = formatearNumeroFactura(anio, num(documentoContador?.data()?.invoices) + 1);
    const porRuta = new Map(leidos.map((l) => [l!.ref.path, l!]));
    const plan = planDeMovimientos(
      movimientosDe(lineas, "salida", `Factura ${numero}`),
      (ref) => porRuta.get(ref.path),
      autorUid,
      typeof d.orderId === "string" ? d.orderId : null,
    );
    if (!plan.ok) return conflicto(plan.mensaje);

    const emisor: EmisorFactura = {
      razonSocial: configuracion.emisor.razonSocial,
      nit: configuracion.emisor.nit,
      direccion: configuracion.emisor.direccion,
      telefono: configuracion.telefono || configuracion.whatsapp,
      email: configuracion.email,
    };

    const totales = calcularTotales(lineas, configuracion.impuestoPorcentaje);

    tx.set(contador, { invoices: num(documentoContador?.data()?.invoices) + 1 }, { merge: true });
    plan.aplicar(tx);
    tx.update(referencia, {
      ...totales,
      numero,
      estado: "emitida",
      // Se guarda para poder sumar "por cobrar" con una sola agregación,
      // sin leer todas las facturas (SPEC.md §6.2 y §7).
      saldo: totales.total,
      emisor,
      impuestoPorcentaje: configuracion.impuestoPorcentaje,
      stockDescontado: stock.length > 0,
      emitidaEn: FieldValue.serverTimestamp(),
      emitidaPor: autorUid,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, numero };
  }, INTENTOS_DE_STOCK);
}

/** Como `leerConfiguracion`, con el documento ya leído dentro de la transacción. */
function configuracionDe(documento: FirebaseFirestore.DocumentSnapshot | undefined) {
  if (!documento?.exists) return CONFIGURACION_VACIA;
  const r = configuracionSchema.safeParse(documento.data());
  return r.success ? r.data : CONFIGURACION_VACIA;
}

/**
 * Anula una factura emitida o pagada, con motivo — SPEC.md §6.5. El número
 * queda registrado (anulada, no borrada), y si la factura descontó stock, lo
 * devuelve con una entrada que dice por qué.
 */
export async function anularFactura(id: string, motivo: string, autorUid: string): Promise<Resultado> {
  const referencia = facturas().doc(id);
  const previa = await referencia.get();
  if (!previa.exists) return noExiste;
  const lineasPrevias = aLineas(previa.data()!.lineas);
  const devolver = previa.data()!.stockDescontado === true;
  const stock = devolver ? referenciasDeStock(lineasPrevias) : [];

  return db().runTransaction(async (tx): Promise<Resultado> => {
    const [documento, ...leidos] = await tx.getAll(referencia, ...stock);
    if (!documento?.exists) return noExiste;
    const d = documento.data()!;
    if (d.estado === "anulada") return conflicto("Esta factura ya estaba anulada.");
    if (d.estado === "borrador") return conflicto("Un borrador no se anula: se elimina.");

    if (devolver) {
      // Si el producto se eliminó después, no hay dónde devolver: esa línea se omite.
      const porRuta = new Map(leidos.map((l) => [l!.ref.path, l!]));
      const existentes = movimientosDe(lineasPrevias, "entrada", `Anulación de ${txt(d.numero)}`).filter((m) => {
        const { producto, variante } = referenciasDeVariante(m.productId, m.variantId);
        return porRuta.get(variante.path)?.exists && porRuta.get(producto.path)?.exists;
      });
      const plan = planDeMovimientos(existentes, (ref) => porRuta.get(ref.path), autorUid, txt(d.orderId) || null);
      if (!plan.ok) return conflicto(plan.mensaje);
      plan.aplicar(tx);
    }

    tx.update(referencia, {
      estado: "anulada",
      saldo: 0,
      anulacion: { motivo, autorUid, fecha: FieldValue.serverTimestamp() },
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true };
  }, INTENTOS_DE_STOCK);
}

/**
 * Registra un pago, parcial o total — SPEC.md §6.5. Cuando lo pagado cubre
 * el total, la factura pasa a Pagada. No se acepta pagar más que el saldo:
 * sería un error de digitación, y aceptarlo lo escondería.
 */
export async function registrarPago(id: string, pago: Pago, autorUid: string): Promise<Resultado<{ saldo: number }>> {
  const referencia = facturas().doc(id);
  return db().runTransaction(async (tx): Promise<Resultado<{ saldo: number }>> => {
    const documento = await tx.get(referencia);
    if (!documento.exists) return noExiste;
    const d = documento.data()!;
    if (d.estado !== "emitida") {
      return conflicto(d.estado === "pagada" ? "Esta factura ya está pagada." : "Solo se registran pagos de una factura emitida.");
    }
    const saldo = saldoPendiente(num(d.total), aPagos(d.pagos, new Map()));
    if (pago.monto > saldo) {
      return conflicto(`El monto supera lo que falta por pagar (${pesosCO.format(saldo)}).`);
    }
    const nuevoSaldo = saldo - pago.monto;
    tx.update(referencia, {
      // Timestamp.now(): serverTimestamp no se puede usar dentro de un arreglo.
      pagos: FieldValue.arrayUnion({ ...pago, autorUid, registradoEn: Timestamp.now() }),
      saldo: nuevoSaldo,
      ...(nuevoSaldo === 0 ? { estado: "pagada", pagadaEn: FieldValue.serverTimestamp() } : {}),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { ok: true, saldo: nuevoSaldo };
  });
}
