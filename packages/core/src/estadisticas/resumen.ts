import "server-only";

import { AggregateField, Timestamp, type Query } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../firebase/admin";
import { anioEnColombia } from "../pedidos/numeracion";

/**
 * Los números del tablero — SPEC.md §6.2, que pide que salgan de
 * `stats/resumen` y no de contar colecciones en cada visita.
 *
 * Se recalculan con consultas de agregación (`count` y `sum`): Firestore las
 * cobra por cada mil entradas de índice leídas, no por documento, así que
 * "¿cuántos pedidos hay en producción?" cuesta una lectura aunque haya
 * cientos. El resultado se guarda en `stats/resumen` con la hora, y el
 * tablero lo reutiliza mientras esté fresco.
 *
 * Se recalcula en vez de llevar contadores al día en cada escritura: un
 * contador que se pierde un incremento queda mal para siempre, y aquí el
 * peor caso es un número viejo de unos minutos.
 */

export const MINUTOS_FRESCO = 10;

export interface ResumenDelTablero {
  pedidosNuevos: number;
  pedidosEnProduccion: number;
  /** Suma de lo que falta por cobrar de las facturas emitidas. */
  porCobrar: number;
  /** Facturado en el mes: facturas emitidas este mes que no se anularon. */
  ingresosMes: number;
  ingresosMesAnterior: number;
  variantesBajoMinimo: number;
  actualizadoEn: string | null;
}

const db = () => getFirebaseAdmin().db;
const referencia = () => db().collection("stats").doc("resumen");

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const cuantos = async (consulta: Query) => (await consulta.count().get()).data().count;

const suma = async (consulta: Query, campo: string) =>
  num((await consulta.aggregate({ total: AggregateField.sum(campo) }).get()).data().total);

/** Mes calendario en hora de Colombia: [inicio, fin). */
export function mesEnColombia(fecha: Date, desplazamiento = 0): { inicio: Date; fin: Date } {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit" })
    .format(fecha)
    .split("-");
  const anio = Number(partes[0]);
  const mes = Number(partes[1]) - 1 + desplazamiento;
  // Colombia no cambia de hora, así que su desfase es siempre UTC-5.
  const inicio = new Date(Date.UTC(anio, mes, 1, 5));
  const fin = new Date(Date.UTC(anio, mes + 1, 1, 5));
  return { inicio, fin };
}

/** Lo facturado en un rango: emitidas y pagadas cuentan; las anuladas no. */
async function facturadoEntre(inicio: Date, fin: Date): Promise<number> {
  const facturas = db().collection("invoices");
  const enElRango = (estado: string) =>
    facturas
      .where("estado", "==", estado)
      .where("emitidaEn", ">=", Timestamp.fromDate(inicio))
      .where("emitidaEn", "<", Timestamp.fromDate(fin));

  const [emitidas, pagadas] = await Promise.all([
    suma(enElRango("emitida"), "total"),
    suma(enElRango("pagada"), "total"),
  ]);
  return emitidas + pagadas;
}

/** Recalcula y guarda `stats/resumen`. */
export async function recalcularResumen(ahora = new Date()): Promise<ResumenDelTablero> {
  const pedidos = db().collection("orders");
  const esteMes = mesEnColombia(ahora);
  const mesPasado = mesEnColombia(ahora, -1);

  const [pedidosNuevos, pedidosEnProduccion, porCobrar, ingresosMes, ingresosMesAnterior, variantesBajoMinimo] =
    await Promise.all([
      cuantos(pedidos.where("estado", "==", "recibido")),
      cuantos(pedidos.where("estado", "==", "en_produccion")),
      suma(db().collection("invoices").where("estado", "==", "emitida"), "saldo"),
      facturadoEntre(esteMes.inicio, esteMes.fin),
      facturadoEntre(mesPasado.inicio, mesPasado.fin),
      suma(db().collection("products").where("activo", "==", true), "variantesBajoMinimo"),
    ]);

  const resumen = { pedidosNuevos, pedidosEnProduccion, porCobrar, ingresosMes, ingresosMesAnterior, variantesBajoMinimo };
  // La hora la pone quien calcula, no el servidor de Firestore: es la misma
  // máquina, y así "¿está fresco?" se compara contra el mismo reloj.
  await referencia().set({ ...resumen, anio: anioEnColombia(ahora), actualizadoEn: Timestamp.fromDate(ahora) });
  return { ...resumen, actualizadoEn: ahora.toISOString() };
}

/**
 * El resumen guardado, recalculado si está viejo. `forzar` lo recalcula
 * siempre: es lo que hace el botón «Actualizar» del tablero.
 */
export async function leerResumen(opciones: { forzar?: boolean } = {}, ahora = new Date()): Promise<ResumenDelTablero> {
  if (opciones.forzar) return recalcularResumen(ahora);

  const documento = await referencia().get();
  const d = documento.data();
  const actualizadoEn = d?.actualizadoEn instanceof Timestamp ? d.actualizadoEn.toDate() : null;
  const fresco = actualizadoEn !== null && ahora.getTime() - actualizadoEn.getTime() < MINUTOS_FRESCO * 60_000;
  if (!documento.exists || !fresco) return recalcularResumen(ahora);

  return {
    pedidosNuevos: num(d?.pedidosNuevos),
    pedidosEnProduccion: num(d?.pedidosEnProduccion),
    porCobrar: num(d?.porCobrar),
    ingresosMes: num(d?.ingresosMes),
    ingresosMesAnterior: num(d?.ingresosMesAnterior),
    variantesBajoMinimo: num(d?.variantesBajoMinimo),
    actualizadoEn: actualizadoEn!.toISOString(),
  };
}
