import "server-only";

import { getFirebaseAdmin } from "../firebase/admin";
import type { Invitado } from "../pedidos/esquemas";

/** Datos de contacto de un cliente con cuenta — `users/{uid}`, SPEC.md §7. */
export interface ContactoCliente {
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
}

const texto = (valor: unknown) => (typeof valor === "string" ? valor : "");

/**
 * Lee el contacto guardado de un cliente. Lo que falte vuelve vacío: quien
 * lo usa (el formulario de pedido) lo pide en vez de inventarlo.
 */
export async function leerContactoCliente(uid: string): Promise<Partial<ContactoCliente>> {
  const documento = await getFirebaseAdmin().db.collection("users").doc(uid).get();
  const datos = documento.data() ?? {};
  return {
    nombre: texto(datos.nombre),
    email: texto(datos.email),
    telefono: texto(datos.telefono),
    ciudad: texto(datos.ciudad),
  };
}

/**
 * Contactos de varios clientes a la vez, para las listas del panel. Un solo
 * `getAll` en lugar de una lectura por fila (AGENTS.md §5: nunca leer dentro
 * de un bucle).
 */
export async function leerContactosClientes(uids: string[]): Promise<Map<string, Partial<ContactoCliente>>> {
  const unicos = [...new Set(uids)];
  const resultado = new Map<string, Partial<ContactoCliente>>();
  if (unicos.length === 0) return resultado;

  const { db } = getFirebaseAdmin();
  const documentos = await db.getAll(...unicos.map((uid) => db.collection("users").doc(uid)));
  for (const documento of documentos) {
    const datos = documento.data() ?? {};
    resultado.set(documento.id, {
      nombre: texto(datos.nombre),
      email: texto(datos.email),
      telefono: texto(datos.telefono),
      ciudad: texto(datos.ciudad),
    });
  }
  return resultado;
}

/** Lo que se escribe en `users/{uid}` al pedir. Nunca incluye `role`. */
export function contactoParaGuardar(contacto: Invitado, emailDeLaCuenta: string | null): ContactoCliente {
  return {
    nombre: contacto.nombre,
    // El correo es el de la cuenta, no el que venga en el formulario: es con
    // el que el cliente entra y el que ya está verificado por Firebase Auth.
    email: emailDeLaCuenta ?? contacto.email,
    telefono: contacto.telefono,
    ciudad: contacto.ciudad,
  };
}
