/**
 * Rellena `orders/{id}.busqueda` en los pedidos creados antes de que existiera
 * la búsqueda por nombre. Los pedidos nuevos ya lo traen de fábrica.
 *
 * Solo escribe en los que no lo tienen, así que se puede correr varias veces.
 * Cuesta una lectura por pedido más una por cada cliente con cuenta distinto,
 * y una escritura por pedido reindexado.
 *
 *   Emulador:  FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --env-file=apps/web/.env.local scripts/reindexar-busqueda.mjs
 *   Real:      node --env-file=apps/web/.env.local scripts/reindexar-busqueda.mjs
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// La misma función que usa el servidor al crear el pedido: si cambia la
// forma de indexar, cambia en los dos sitios a la vez.
import { tokensDeBusqueda } from "../packages/core/src/pedidos/busqueda.ts";

const usandoEmuladores = Boolean(process.env.FIRESTORE_EMULATOR_HOST);
const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;

initializeApp(
  usandoEmuladores
    ? { projectId }
    : {
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      },
);

const db = getFirestore();
const pedidos = await db.collection("orders").get();
const pendientes = pedidos.docs.filter((d) => !Array.isArray(d.data().busqueda));

const uids = [...new Set(pendientes.map((d) => d.data().uid).filter(Boolean))];
const cuentas = new Map(
  uids.length ? (await db.getAll(...uids.map((uid) => db.doc(`users/${uid}`)))).map((d) => [d.id, d.data() ?? {}]) : [],
);

let lote = db.batch();
let enLote = 0;
for (const pedido of pendientes) {
  const datos = pedido.data();
  const contacto = datos.uid ? (cuentas.get(datos.uid) ?? {}) : (datos.invitado ?? {});
  lote.update(pedido.ref, {
    busqueda: tokensDeBusqueda({
      numero: datos.numero ?? "",
      nombre: contacto.nombre ?? "",
      email: contacto.email ?? "",
      telefono: contacto.telefono ?? "",
    }),
  });
  // Un lote admite 500 escrituras.
  if (++enLote === 450) {
    await lote.commit();
    lote = db.batch();
    enLote = 0;
  }
}
if (enLote > 0) await lote.commit();

console.log(
  `${pendientes.length} pedidos reindexados de ${pedidos.size} en ${projectId}${usandoEmuladores ? " (emulador)" : " (proyecto real)"}.`,
);
