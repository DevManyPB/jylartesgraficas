import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../firebase/admin";
import { CONFIGURACION_VACIA, configuracionSchema, type Configuracion } from "./esquemas";

const referencia = () => getFirebaseAdmin().db.collection("settings").doc("general");

/**
 * Lee `settings/general`. Si no existe, o si algo guardado ya no encaja con el
 * esquema, devuelve la configuración vacía en lugar de fallar: el sitio
 * público tiene que seguir en pie aunque la configuración esté a medias.
 */
export async function leerConfiguracion(): Promise<Configuracion> {
  const documento = await referencia().get();
  if (!documento.exists) return CONFIGURACION_VACIA;

  const resultado = configuracionSchema.safeParse(documento.data());
  return resultado.success ? resultado.data : CONFIGURACION_VACIA;
}

/**
 * Guarda la configuración completa. Recibe datos ya validados: la Route
 * Handler parsea con el mismo esquema antes de llamar aquí.
 */
export async function guardarConfiguracion(datos: Configuracion, autorUid: string): Promise<void> {
  await referencia().set({
    ...datos,
    actualizadoPor: autorUid,
    actualizadoEn: FieldValue.serverTimestamp(),
  });
}
