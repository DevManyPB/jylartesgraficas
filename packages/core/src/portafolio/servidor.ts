import "server-only";

import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { aImagenes, borrarImagenes, borrarImagenesSobrantes, resolverImagenes } from "../catalogo/imagenes";
import { idYOrdenNuevos, moverEnColeccion, reordenarEnColeccion } from "../catalogo/orden";
import { getFirebaseAdmin } from "../firebase/admin";
import type { ProyectoDelPanel, ProyectoEditable } from "./esquemas";

export const PROYECTOS_POR_PAGINA = 25;

const coleccion = () => getFirebaseAdmin().db.collection("portfolio");
const txt = (v: unknown) => (typeof v === "string" ? v : "");

function aProyecto(id: string, d: DocumentData): ProyectoDelPanel {
  return {
    id,
    titulo: txt(d.titulo),
    categoria: txt(d.categoria),
    cliente: txt(d.cliente),
    descripcion: txt(d.descripcion),
    destacado: d.destacado === true,
    publicado: d.publicado === true,
    orden: typeof d.orden === "number" ? d.orden : 0,
    imagenes: aImagenes(d.imagenes),
  };
}

export async function listarProyectos(despuesDe?: string): Promise<{ filas: ProyectoDelPanel[]; siguiente: string | null }> {
  let consulta = coleccion().orderBy("orden");
  if (despuesDe) {
    const cursor = await coleccion().doc(despuesDe).get();
    if (cursor.exists) consulta = consulta.startAfter(cursor);
  }
  const r = await consulta.limit(PROYECTOS_POR_PAGINA + 1).get();
  const docs = r.docs.slice(0, PROYECTOS_POR_PAGINA);
  return {
    filas: docs.map((d) => aProyecto(d.id, d.data())),
    siguiente: r.docs.length > PROYECTOS_POR_PAGINA ? (docs.at(-1)?.id ?? null) : null,
  };
}

export async function leerProyecto(id: string): Promise<ProyectoDelPanel | null> {
  const d = await coleccion().doc(id).get();
  return d.exists ? aProyecto(d.id, d.data()!) : null;
}

export async function crearProyecto(datos: ProyectoEditable): Promise<string> {
  const imagenes = await resolverImagenes(datos.imagenes, []);
  return getFirebaseAdmin().db.runTransaction(async (tx) => {
    const { id, orden } = await idYOrdenNuevos(tx, coleccion(), datos.titulo, "proyecto");
    tx.set(coleccion().doc(id), {
      ...datos,
      imagenes,
      slug: id,
      orden,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return id;
  });
}

export async function actualizarProyecto(id: string, datos: ProyectoEditable): Promise<boolean> {
  const referencia = coleccion().doc(id);
  const documento = await referencia.get();
  if (!documento.exists) return false;

  const antes = aImagenes(documento.data()!.imagenes);
  const imagenes = await resolverImagenes(datos.imagenes, antes);
  await referencia.update({ ...datos, imagenes, updatedAt: FieldValue.serverTimestamp() });
  await borrarImagenesSobrantes(antes, imagenes);
  return true;
}

export function moverProyecto(id: string, direccion: -1 | 1): Promise<boolean> {
  return moverEnColeccion(coleccion(), id, direccion);
}

/** Aplica el orden de los proyectos que se ven en pantalla, tras arrastrar. */
export function reordenarProyectos(ids: string[]): Promise<boolean> {
  return reordenarEnColeccion(coleccion(), ids);
}

export async function eliminarProyecto(id: string): Promise<boolean> {
  const referencia = coleccion().doc(id);
  const documento = await referencia.get();
  if (!documento.exists) return false;
  await referencia.delete();
  await borrarImagenes(aImagenes(documento.data()!.imagenes));
  return true;
}

/** Categorías en uso, para sugerirlas en el formulario. */
export async function categoriasDeProyectos(): Promise<string[]> {
  const r = await coleccion().select("categoria").get();
  return [...new Set(r.docs.map((d) => txt(d.data().categoria)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}
