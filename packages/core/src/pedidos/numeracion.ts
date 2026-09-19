// Sin `server-only`: `formatearNumeroPedido` es puro y lo usa también la
// pantalla de confirmación. La transacción recibe `db` por parámetro, así que
// este módulo no importa nada del servidor en tiempo de ejecución.
import type { Firestore } from "firebase-admin/firestore";

const anioColombia = new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "America/Bogota" });

/**
 * El año según la hora de Colombia. El servidor puede correr en UTC, y un
 * pedido o una factura del 31 de diciembre a las 8 p. m. no debe numerarse
 * con el año siguiente.
 */
export function anioEnColombia(fecha: Date): number {
  return Number(anioColombia.format(fecha));
}

/** `JYL-2026-0147` — SPEC.md §4.5. */
export function formatearNumeroPedido(anio: number, consecutivo: number): string {
  return `JYL-${anio}-${String(consecutivo).padStart(4, "0")}`;
}

/**
 * Siguiente consecutivo del año, dentro de una transacción.
 *
 * AGENTS.md §6: el número nunca se genera leyendo el último documento. Con
 * dos pedidos simultáneos, leer-el-último daría el mismo número a los dos.
 * La transacción sobre `counters/{año}` es lo que garantiza que no haya
 * repetidos ni huecos.
 */
export async function siguienteNumeroDePedido(db: Firestore, ahora = new Date()): Promise<string> {
  const anio = anioEnColombia(ahora);
  const referencia = db.collection("counters").doc(String(anio));

  const consecutivo = await db.runTransaction(async (tx) => {
    const documento = await tx.get(referencia);
    const actual = (documento.data()?.orders as number | undefined) ?? 0;
    const siguiente = actual + 1;
    tx.set(referencia, { orders: siguiente }, { merge: true });
    return siguiente;
  });

  return formatearNumeroPedido(anio, consecutivo);
}
