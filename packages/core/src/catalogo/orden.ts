import "server-only";

import type { CollectionReference, Transaction } from "firebase-admin/firestore";
import { slugDe } from "./slug";

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/**
 * Sube o baja un documento un puesto, intercambiando `orden` con el vecino en
 * una transacción. No necesita la lista completa, así que funciona igual
 * aunque el vecino esté en otra página del panel.
 */
export async function moverEnColeccion(
  coleccion: CollectionReference,
  id: string,
  direccion: -1 | 1,
): Promise<boolean> {
  return coleccion.firestore.runTransaction(async (tx) => {
    const referencia = coleccion.doc(id);
    const documento = await tx.get(referencia);
    if (!documento.exists) return false;
    const orden = num(documento.data()!.orden);

    const vecinos = await tx.get(
      direccion === -1
        ? coleccion.where("orden", "<", orden).orderBy("orden", "desc").limit(1)
        : coleccion.where("orden", ">", orden).orderBy("orden", "asc").limit(1),
    );
    const vecino = vecinos.docs[0];
    if (!vecino) return false;

    tx.update(referencia, { orden: num(vecino.data().orden) });
    tx.update(vecino.ref, { orden });
    return true;
  });
}

/**
 * Dentro de una transacción: un id libre a partir del nombre (el slug, o el
 * slug con un número si ya existe) y el siguiente `orden`, al final de la lista.
 */
export async function idYOrdenNuevos(
  tx: Transaction,
  coleccion: CollectionReference,
  nombre: string,
  porDefecto: string,
): Promise<{ id: string; orden: number }> {
  const base = slugDe(nombre) || porDefecto;
  let id = base;
  for (let n = 2; (await tx.get(coleccion.doc(id))).exists; n += 1) id = `${base}-${n}`;
  const ultimo = await tx.get(coleccion.orderBy("orden", "desc").limit(1));
  const orden = ultimo.empty ? 0 : num(ultimo.docs[0]!.data().orden) + 1;
  return { id, orden };
}
