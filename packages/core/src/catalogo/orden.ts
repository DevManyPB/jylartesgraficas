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

/**
 * Reordena los documentos que se ven en pantalla, arrastrando — SPEC.md §6.7.
 *
 * Solo toca los `orden` de esos documentos: reparte entre ellos, en el nuevo
 * orden, los valores que ya tenían. Así funciona con listas paginadas, porque
 * ninguna otra página cambia de sitio, y dos personas ordenando a la vez no
 * pueden entrelazar sus listas: la transacción relee lo que va a escribir.
 *
 * Devuelve false si algún id ya no existe: la lista cambió mientras se
 * ordenaba y quien llama debe recargar en vez de guardar un orden a medias.
 */
export async function reordenarEnColeccion(coleccion: CollectionReference, ids: string[]): Promise<boolean> {
  if (ids.length === 0 || new Set(ids).size !== ids.length) return false;

  return coleccion.firestore.runTransaction(async (tx) => {
    const documentos = await tx.getAll(...ids.map((id) => coleccion.doc(id)));
    if (documentos.some((d) => !d.exists)) return false;

    const ordenes = documentos.map((d) => num(d.data()!.orden)).sort((a, b) => a - b);
    ids.forEach((id, i) => tx.update(coleccion.doc(id), { orden: ordenes[i] }));
    return true;
  });
}
