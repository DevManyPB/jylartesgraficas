import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";
import { leerConfigCliente, usarEmuladores } from "./env";

interface ClienteFirebase {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cliente: ClienteFirebase | null = null;

/** SDK de cliente, perezoso y único. Contra los emuladores en desarrollo
 *  (AGENTS.md §4), contra el proyecto real solo en producción. */
export function getFirebase(): ClienteFirebase {
  if (cliente) return cliente;

  const app = getApps().length > 0 ? getApp() : initializeApp(leerConfigCliente());
  const auth = getAuth(app);
  const db = getFirestore(app);

  if (usarEmuladores()) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }

  cliente = { app, auth, db };
  return cliente;
}
