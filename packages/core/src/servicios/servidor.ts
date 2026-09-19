import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { slugDe } from "../catalogo/slug";
import { getFirebaseAdmin } from "../firebase/admin";
import { servicioEditableSchema, type ServicioDelPanel, type ServicioEditable } from "./esquemas";

const coleccion = () => getFirebaseAdmin().db.collection("services");

function aServicioDelPanel(id: string, datos: FirebaseFirestore.DocumentData): ServicioDelPanel | null {
  const resultado = servicioEditableSchema.safeParse(datos);
  if (!resultado.success) return null;
  return { id, orden: typeof datos.orden === "number" ? datos.orden : 0, ...resultado.data };
}

/**
 * Todo el catálogo, activos e inactivos, para el panel. Son una o dos docenas
 * de documentos; paginarlos no ahorraría nada y complicaría ordenarlos.
 */
export async function listarServiciosDelPanel(): Promise<ServicioDelPanel[]> {
  const consulta = await coleccion().orderBy("orden").get();
  return consulta.docs.flatMap((d) => {
    const servicio = aServicioDelPanel(d.id, d.data());
    return servicio ? [servicio] : [];
  });
}

export async function leerServicioDelPanel(id: string): Promise<ServicioDelPanel | null> {
  const documento = await coleccion().doc(id).get();
  return documento.exists ? aServicioDelPanel(documento.id, documento.data()!) : null;
}

/**
 * Crea un servicio al final del catálogo. El id es el slug del nombre; si ya
 * existe uno igual se le añade un número, en vez de pisar el anterior.
 */
export async function crearServicio(datos: ServicioEditable): Promise<string> {
  const { db } = getFirebaseAdmin();
  const base = slugDe(datos.nombre) || "servicio";

  return db.runTransaction(async (tx) => {
    let id = base;
    for (let n = 2; (await tx.get(coleccion().doc(id))).exists; n += 1) id = `${base}-${n}`;

    const ultimo = await tx.get(coleccion().orderBy("orden", "desc").limit(1));
    const orden = ultimo.empty ? 0 : ((ultimo.docs[0]!.data().orden as number) ?? 0) + 1;

    tx.set(coleccion().doc(id), {
      ...datos,
      slug: id,
      orden,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return id;
  });
}

/** Devuelve false si el servicio no existe. */
export async function actualizarServicio(id: string, datos: ServicioEditable): Promise<boolean> {
  const referencia = coleccion().doc(id);
  const documento = await referencia.get();
  if (!documento.exists) return false;

  await referencia.update({ ...datos, updatedAt: FieldValue.serverTimestamp() });
  return true;
}

/**
 * Aplica un orden nuevo. Exige la lista completa: si llegara a medias —otra
 * pestaña creó un servicio mientras tanto— quedarían dos con el mismo número
 * y el orden público sería arbitrario. En ese caso se rechaza y el panel
 * recarga la lista.
 */
export async function reordenarServicios(ids: string[]): Promise<boolean> {
  const { db } = getFirebaseAdmin();
  const actuales = await coleccion().select().get();
  const existentes = new Set(actuales.docs.map((d) => d.id));

  const completa = ids.length === existentes.size && new Set(ids).size === ids.length && ids.every((id) => existentes.has(id));
  if (!completa) return false;

  const lote = db.batch();
  ids.forEach((id, indice) => lote.update(coleccion().doc(id), { orden: indice }));
  await lote.commit();
  return true;
}
