import "server-only";

import { getFirebaseAdmin } from "../firebase/admin";
import { esCategoriaServicio, type Servicio } from "./servicios";

/**
 * Servicios activos, ordenados.
 *
 * Quien llama debe envolver esto en la caché de Next: son catorce documentos y
 * leerlos en cada visita gastaría cuota sin motivo (SPEC.md §2.7).
 */
export async function leerServiciosActivos(): Promise<Servicio[]> {
  const { db } = getFirebaseAdmin();
  const consulta = await db
    .collection("services")
    .where("activo", "==", true)
    .orderBy("orden")
    .get();

  return consulta.docs.flatMap((documento) => {
    const datos = documento.data();
    if (!esCategoriaServicio(datos.categoria)) return [];

    return [
      {
        id: documento.id,
        nombre: String(datos.nombre ?? ""),
        categoria: datos.categoria,
        descripcion: String(datos.descripcion ?? ""),
        requiereMedidas: Boolean(datos.requiereMedidas),
        // Ausente en documentos viejos: por defecto se piden, como al sembrar.
        requiereReferencias: datos.requiereReferencias !== false,
      },
    ];
  });
}
