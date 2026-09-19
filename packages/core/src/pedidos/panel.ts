import "server-only";

import { FieldValue, Timestamp, type DocumentData, type Query } from "firebase-admin/firestore";
import { leerContactosClientes, type ContactoCliente } from "../clientes/perfil";
import { getFirebaseAdmin } from "../firebase/admin";
import { planDeBusqueda } from "./busqueda";
import { estadoPedidoSchema, type EstadoPedido } from "./esquemas";
import type {
  ArchivoDelPedido,
  ContactoDelPedido,
  EventoDelPedido,
  FilaPedido,
  PaginaDePedidos,
  PedidoDelPanel,
} from "./tipos-panel";

/** AGENTS.md §5: las listas del panel se paginan de 25 en 25 con cursor. */
export const PEDIDOS_POR_PAGINA = 25;

const coleccion = () => getFirebaseAdmin().db.collection("orders");

const iso = (valor: unknown): string | null =>
  valor instanceof Timestamp ? valor.toDate().toISOString() : null;

const texto = (valor: unknown): string => (typeof valor === "string" ? valor : "");

function estadoDe(valor: unknown): EstadoPedido {
  const resultado = estadoPedidoSchema.safeParse(valor);
  // Un estado desconocido no debería existir; si aparece, se muestra como
  // recibido para que el pedido no desaparezca de la vista.
  return resultado.success ? resultado.data : "recibido";
}

/** Nombres de los servicios por id: son pocos y se leen de una vez. */
async function nombresDeServicios(): Promise<Map<string, string>> {
  const consulta = await getFirebaseAdmin().db.collection("services").select("nombre").get();
  return new Map(consulta.docs.map((d) => [d.id, texto(d.data().nombre)]));
}

function contactoDe(datos: DocumentData, cuentas: Map<string, Partial<ContactoCliente>>): ContactoDelPedido {
  if (typeof datos.uid === "string" && datos.uid) {
    const cuenta = cuentas.get(datos.uid) ?? {};
    return {
      nombre: cuenta.nombre ?? "",
      email: cuenta.email ?? "",
      telefono: cuenta.telefono ?? "",
      ciudad: cuenta.ciudad ?? "",
      conCuenta: true,
    };
  }
  const invitado = (datos.invitado ?? {}) as Record<string, unknown>;
  return {
    nombre: texto(invitado.nombre),
    email: texto(invitado.email),
    telefono: texto(invitado.telefono),
    ciudad: texto(invitado.ciudad),
    conCuenta: false,
  };
}

function filaDe(
  id: string,
  datos: DocumentData,
  servicios: Map<string, string>,
  cuentas: Map<string, Partial<ContactoCliente>>,
): FilaPedido {
  return {
    id,
    numero: texto(datos.numero),
    estado: estadoDe(datos.estado),
    creadoEn: iso(datos.createdAt),
    servicio: typeof datos.serviceId === "string" ? (servicios.get(datos.serviceId) ?? datos.serviceId) : null,
    contacto: contactoDe(datos, cuentas),
    archivos: Array.isArray(datos.archivos) ? datos.archivos.length : 0,
    archivosIncompletos: datos.archivosIncompletos === true,
  };
}

async function filasDe(documentos: FirebaseFirestore.QueryDocumentSnapshot[]): Promise<FilaPedido[]> {
  const uids = documentos.map((d) => d.data().uid).filter((uid): uid is string => typeof uid === "string" && uid !== "");
  const [servicios, cuentas] = await Promise.all([nombresDeServicios(), leerContactosClientes(uids)]);
  return documentos.map((d) => filaDe(d.id, d.data(), servicios, cuentas));
}

export interface FiltroPedidos {
  estado?: EstadoPedido;
  /** Id del último pedido de la página anterior. */
  despuesDe?: string;
}

/**
 * Una página de pedidos, del más nuevo al más viejo. Se piden 26 para saber
 * si hay otra página sin gastar una consulta más.
 */
export async function listarPedidos(filtro: FiltroPedidos = {}): Promise<PaginaDePedidos> {
  let consulta: Query = coleccion();
  if (filtro.estado) consulta = consulta.where("estado", "==", filtro.estado);
  consulta = consulta.orderBy("createdAt", "desc");

  if (filtro.despuesDe) {
    const cursor = await coleccion().doc(filtro.despuesDe).get();
    if (cursor.exists) consulta = consulta.startAfter(cursor);
  }

  const resultado = await consulta.limit(PEDIDOS_POR_PAGINA + 1).get();
  const documentos = resultado.docs.slice(0, PEDIDOS_POR_PAGINA);
  const hayMas = resultado.docs.length > PEDIDOS_POR_PAGINA;

  return {
    filas: await filasDe(documentos),
    siguiente: hayMas ? (documentos.at(-1)?.id ?? null) : null,
  };
}

/**
 * Busca por número, nombre, teléfono o correo — SPEC.md §6.3. Si lo escrito
 * parece un número de pedido se busca también exacto, y ese resultado va
 * primero: "42" puede ser el pedido 42 o el final de un teléfono.
 */
export async function buscarPedidos(entrada: string, ahora = new Date()): Promise<FilaPedido[]> {
  const documentos = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();

  const numero = normalizarNumeroBuscado(entrada, ahora.getFullYear());
  if (numero) {
    const exacto = await coleccion().where("numero", "==", numero).limit(1).get();
    exacto.docs.forEach((d) => documentos.set(d.id, d));
  }

  const plan = planDeBusqueda(entrada);
  if (plan) {
    const coincidencias = await coleccion()
      .where("busqueda", "array-contains", plan.consulta)
      .orderBy("createdAt", "desc")
      .limit(PEDIDOS_POR_PAGINA)
      .get();
    for (const d of coincidencias.docs) {
      const tokens = (d.data().busqueda ?? []) as string[];
      if (plan.resto.every((palabra) => tokens.includes(palabra))) documentos.set(d.id, d);
    }
  }

  return filasDe([...documentos.values()]);
}

export function normalizarNumeroBuscado(entrada: string, anioActual: number): string | null {
  const limpio = entrada.trim().toUpperCase();
  const completo = /^JYL-(\d{4})-(\d{1,6})$/.exec(limpio);
  if (completo) return `JYL-${completo[1]}-${completo[2]!.padStart(4, "0")}`;
  const solo = /^\d{1,6}$/.exec(limpio);
  if (solo) return `JYL-${anioActual}-${limpio.padStart(4, "0")}`;
  return null;
}

/** Nombres visibles de quienes escribieron eventos, desde Auth: no gasta lecturas. */
async function nombresDeAutores(uids: string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(uids)];
  if (unicos.length === 0) return new Map();
  const { users } = await getFirebaseAdmin().auth.getUsers(unicos.map((uid) => ({ uid })));
  return new Map(users.map((u) => [u.uid, u.displayName || u.email || "Alguien del estudio"]));
}

export async function leerPedidoDelPanel(id: string): Promise<PedidoDelPanel | null> {
  const referencia = coleccion().doc(id);
  const [documento, eventos] = await Promise.all([
    referencia.get(),
    referencia.collection("events").orderBy("createdAt", "asc").get(),
  ]);
  if (!documento.exists) return null;
  const datos = documento.data()!;

  const [fila] = await filasDe([documento as FirebaseFirestore.QueryDocumentSnapshot]);
  const autores = await nombresDeAutores(
    eventos.docs.map((e) => e.data().autorUid).filter((uid): uid is string => typeof uid === "string"),
  );

  const archivosDetalle: ArchivoDelPedido[] = Array.isArray(datos.archivos)
    ? datos.archivos.map((a: Record<string, unknown>) => ({
        publicId: texto(a.publicId),
        url: texto(a.url),
        formato: texto(a.formato),
        bytes: typeof a.bytes === "number" ? a.bytes : 0,
        ancho: typeof a.ancho === "number" ? a.ancho : null,
        alto: typeof a.alto === "number" ? a.alto : null,
      }))
    : [];

  return {
    ...fila!,
    tipo: datos.tipo === "producto" ? "producto" : "servicio",
    detalle: texto(datos.detalle),
    medidas: typeof datos.medidas === "string" ? datos.medidas : null,
    material: typeof datos.material === "string" ? datos.material : null,
    camposExtra: (datos.camposExtra ?? {}) as Record<string, string>,
    fechaDeseada: typeof datos.fechaDeseada === "string" ? datos.fechaDeseada : null,
    presupuestoAprox: typeof datos.presupuestoAprox === "number" ? datos.presupuestoAprox : null,
    archivosDetalle,
    notasInternas: texto(datos.notasInternas),
    eventos: eventos.docs.map((e): EventoDelPedido => {
      const ev = e.data();
      return {
        id: e.id,
        tipo: texto(ev.tipo),
        estadoAnterior: ev.estadoAnterior ? estadoDe(ev.estadoAnterior) : null,
        estadoNuevo: ev.estadoNuevo ? estadoDe(ev.estadoNuevo) : null,
        mensaje: texto(ev.mensaje),
        autor: typeof ev.autorUid === "string" ? (autores.get(ev.autorUid) ?? null) : null,
        creadoEn: iso(ev.createdAt),
      };
    }),
  };
}

export type ResultadoCambioEstado = "ok" | "no-existe" | "sin-cambio";

/**
 * Cambia el estado y deja el evento en el historial, en la misma
 * transacción: no puede quedar un cambio sin rastro ni un rastro sin cambio.
 */
export async function cambiarEstadoPedido(
  id: string,
  nuevo: EstadoPedido,
  autorUid: string,
  nota: string,
): Promise<ResultadoCambioEstado> {
  const { db } = getFirebaseAdmin();
  const referencia = coleccion().doc(id);

  return db.runTransaction(async (tx) => {
    const documento = await tx.get(referencia);
    if (!documento.exists) return "no-existe";
    const anterior = estadoDe(documento.data()!.estado);
    if (anterior === nuevo) return "sin-cambio";

    tx.update(referencia, { estado: nuevo, updatedAt: FieldValue.serverTimestamp() });
    tx.set(referencia.collection("events").doc(), {
      tipo: "estado",
      estadoAnterior: anterior,
      estadoNuevo: nuevo,
      autorUid,
      mensaje: nota,
      createdAt: FieldValue.serverTimestamp(),
    });
    return "ok";
  });
}

/** Devuelve false si el pedido no existe. */
export async function guardarNotasInternas(id: string, notas: string): Promise<boolean> {
  const referencia = coleccion().doc(id);
  const documento = await referencia.get();
  if (!documento.exists) return false;
  await referencia.update({ notasInternas: notas, updatedAt: FieldValue.serverTimestamp() });
  return true;
}
