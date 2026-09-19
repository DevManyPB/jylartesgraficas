import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../firebase/admin";
import { verificarSubida, type ArchivoSubido } from "../cloudinary/verificar";
import { contactoParaGuardar } from "../clientes/perfil";
import { tokensDeBusqueda } from "./busqueda";
import { siguienteNumeroDePedido } from "./numeracion";
import type { PedidoEntrante } from "./esquemas";

export interface AutorDelPedido {
  uid: string | null;
  /** El correo de la cuenta, si hay sesión. */
  email?: string | null;
}

export interface PedidoCreado {
  id: string;
  numero: string;
  archivosIncompletos: boolean;
}

/**
 * Comprueba con Cloudinary qué archivos llegaron de verdad.
 *
 * SPEC.md §4.5: un pedido enviado nunca se pierde. Si algún archivo falla, no
 * se aborta nada — se guardan los buenos y el pedido queda marcado para que
 * el estudio sepa que falta material.
 */
async function resolverArchivos(publicIds: string[]): Promise<{
  archivos: ArchivoSubido[];
  incompletos: boolean;
}> {
  if (publicIds.length === 0) return { archivos: [], incompletos: false };

  const resultados = await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        return await verificarSubida(publicId);
      } catch {
        return { ok: false as const, problema: { motivo: "formato" as const, mensaje: "" } };
      }
    }),
  );

  const archivos = resultados.flatMap((r) => (r.ok ? [r.archivo] : []));
  return { archivos, incompletos: archivos.length !== publicIds.length };
}

/**
 * Crea el pedido. Todo lo que puede mentir el cliente lo pone el servidor:
 * el número, el estado inicial, las fechas y la identidad.
 */
export async function crearPedido(
  datos: PedidoEntrante,
  autor: AutorDelPedido,
): Promise<PedidoCreado> {
  const { db } = getFirebaseAdmin();

  const { archivos, incompletos } = await resolverArchivos(datos.archivos);
  const numero = await siguienteNumeroDePedido(db);

  const referencia = db.collection("orders").doc();
  const lote = db.batch();

  lote.set(referencia, {
    numero,
    tipo: datos.tipo,
    uid: autor.uid,
    // Con sesión no se guardan datos de invitado: la ficha del usuario manda.
    invitado: autor.uid ? null : datos.invitado,
    serviceId: datos.serviceId,
    items: datos.items,
    detalle: datos.detalle,
    medidas: datos.medidas,
    material: datos.material,
    camposExtra: datos.camposExtra,
    fechaDeseada: datos.fechaDeseada,
    presupuestoAprox: datos.presupuestoAprox,
    archivos,
    archivosIncompletos: incompletos,
    // Para buscar por nombre o teléfono desde el panel (ver busqueda.ts).
    busqueda: tokensDeBusqueda({
      numero,
      nombre: datos.invitado?.nombre ?? "",
      email: (autor.uid ? autor.email : null) ?? datos.invitado?.email ?? "",
      telefono: datos.invitado?.telefono ?? "",
    }),
    estado: "recibido",
    prioridad: "normal",
    notasInternas: "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  lote.set(referencia.collection("events").doc(), {
    tipo: "creado",
    estadoAnterior: null,
    estadoNuevo: "recibido",
    autorUid: autor.uid,
    mensaje: incompletos
      ? "Pedido recibido. Algunas referencias no se subieron correctamente."
      : "Pedido recibido.",
    createdAt: FieldValue.serverTimestamp(),
  });

  // Con cuenta, el contacto va a la ficha del cliente (users/{uid}) y no al
  // pedido: así el estudio tiene a quién llamar, y el cliente no tiene que
  // volver a escribirlo en el próximo pedido. Con `merge` y sin `role`: esto
  // nunca toca el rol, que solo asigna un admin.
  if (autor.uid && datos.invitado) {
    lote.set(
      db.collection("users").doc(autor.uid),
      { ...contactoParaGuardar(datos.invitado, autor.email ?? null), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  }

  await lote.commit();

  return { id: referencia.id, numero, archivosIncompletos: incompletos };
}
