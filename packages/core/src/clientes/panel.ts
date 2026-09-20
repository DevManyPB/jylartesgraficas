import "server-only";

import { FieldValue, Timestamp, type DocumentData, type Query } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../firebase/admin";
import type { FilaFactura } from "../facturas/tipos";
import type { EstadoPedido } from "../pedidos/esquemas";
import { estadoPedidoSchema } from "../pedidos/esquemas";

/**
 * Clientes — SPEC.md §6.6: ficha con contacto, historial de pedidos,
 * facturas, total facturado y notas.
 *
 * Aquí solo aparecen quienes tienen cuenta (`users/{uid}`), que es lo que
 * modela SPEC.md §7. A quien pidió como invitado se le encuentra por nombre
 * o teléfono desde Pedidos, que es donde están sus datos.
 */

export const CLIENTES_POR_PAGINA = 25;

const db = () => getFirebaseAdmin().db;
const usuarios = () => db().collection("users");

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const txt = (v: unknown) => (typeof v === "string" ? v : "");
const iso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null);

export interface FilaCliente {
  uid: string;
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  creadoEn: string | null;
}

export interface PedidoDelCliente {
  id: string;
  numero: string;
  estado: EstadoPedido;
  creadoEn: string | null;
}

export interface ClienteDelPanel extends FilaCliente {
  pedidos: PedidoDelCliente[];
  facturas: FilaFactura[];
  /** Suma de las facturas emitidas y pagadas; las anuladas no cuentan. */
  totalFacturado: number;
  /** Lo que falta por cobrarle. */
  porCobrar: number;
  /** Notas internas del estudio: el cliente nunca las ve. */
  notas: string;
}

function aFila(id: string, d: DocumentData): FilaCliente {
  return {
    uid: id,
    nombre: txt(d.nombre),
    email: txt(d.email),
    telefono: txt(d.telefono),
    ciudad: txt(d.ciudad),
    creadoEn: iso(d.createdAt),
  };
}

export async function listarClientes(despuesDe?: string): Promise<{ filas: FilaCliente[]; siguiente: string | null }> {
  let consulta: Query = usuarios().where("role", "==", "cliente").orderBy("createdAt", "desc");
  if (despuesDe) {
    const cursor = await usuarios().doc(despuesDe).get();
    if (cursor.exists) consulta = consulta.startAfter(cursor);
  }
  const r = await consulta.limit(CLIENTES_POR_PAGINA + 1).get();
  const docs = r.docs.slice(0, CLIENTES_POR_PAGINA);
  return {
    filas: docs.map((d) => aFila(d.id, d.data())),
    siguiente: r.docs.length > CLIENTES_POR_PAGINA ? (docs.at(-1)?.id ?? null) : null,
  };
}

/** Busca por nombre o correo entre quienes tienen cuenta. */
export async function buscarClientes(entrada: string): Promise<FilaCliente[]> {
  const termino = entrada.trim();
  if (termino.length < 2) return [];

  // Prefijo sobre el campo, que es lo que Firestore sabe hacer sin índice de
  // texto: "lau" encuentra "Laura", pero no "María Laura".
  const porCampo = (campo: string) =>
    usuarios()
      .where("role", "==", "cliente")
      .orderBy(campo)
      .startAt(termino)
      .endAt(`${termino}`)
      .limit(CLIENTES_POR_PAGINA)
      .get();

  const [porNombre, porEmail] = await Promise.all([porCampo("nombre"), porCampo("email")]);
  const encontrados = new Map<string, FilaCliente>();
  for (const d of [...porNombre.docs, ...porEmail.docs]) encontrados.set(d.id, aFila(d.id, d.data()));
  return [...encontrados.values()];
}

const notasDe = (uid: string) => usuarios().doc(uid).collection("interno").doc("notas");

export async function leerCliente(uid: string): Promise<ClienteDelPanel | null> {
  const cuenta = await usuarios().doc(uid).get();
  if (!cuenta.exists) return null;

  const facturasDelCliente = db().collection("invoices").where("clienteUid", "==", uid);
  const [pedidos, facturas, notas] = await Promise.all([
    db().collection("orders").where("uid", "==", uid).orderBy("createdAt", "desc").limit(CLIENTES_POR_PAGINA).get(),
    facturasDelCliente.get(),
    notasDe(uid).get(),
  ]);

  const filasFactura: FilaFactura[] = facturas.docs
    .map((f) => {
      const d = f.data();
      const emitida = d.estado === "emitida";
      return {
        id: f.id,
        numero: typeof d.numero === "string" ? d.numero : null,
        estado: d.estado,
        cliente: txt(d.clienteDatos?.nombre),
        total: num(d.total),
        saldo: emitida ? num(d.saldo) : 0,
        creadaEn: iso(d.createdAt),
        emitidaEn: iso(d.emitidaEn),
      };
    })
    .sort((a, b) => (b.creadaEn ?? "").localeCompare(a.creadaEn ?? ""));

  const cuentan = filasFactura.filter((f) => f.estado === "emitida" || f.estado === "pagada");

  return {
    ...aFila(cuenta.id, cuenta.data()!),
    pedidos: pedidos.docs.map((p) => {
      const d = p.data();
      const estado = estadoPedidoSchema.safeParse(d.estado);
      return {
        id: p.id,
        numero: txt(d.numero),
        estado: estado.success ? estado.data : "recibido",
        creadoEn: iso(d.createdAt),
      };
    }),
    facturas: filasFactura,
    totalFacturado: cuentan.reduce((suma, f) => suma + f.total, 0),
    porCobrar: cuentan.reduce((suma, f) => suma + f.saldo, 0),
    notas: txt(notas.data()?.texto),
  };
}

/**
 * Guarda las notas internas. Van en `users/{uid}/interno/notas` y no en el
 * documento del cliente porque ese lo puede leer él mismo (firestore.rules);
 * esta subcolección no la abre ninguna regla, así que solo llega el servidor.
 */
export async function guardarNotasCliente(uid: string, texto: string, autorUid: string): Promise<boolean> {
  const cuenta = await usuarios().doc(uid).get();
  if (!cuenta.exists) return false;

  await notasDe(uid).set({ texto, autorUid, actualizadoEn: FieldValue.serverTimestamp() });
  return true;
}
