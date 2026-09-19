import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { leerConfigAdmin, usarEmuladores } from "./env";

interface AdminFirebase {
  app: App;
  auth: Auth;
  db: Firestore;
}

let admin: AdminFirebase | null = null;

/**
 * Admin SDK: solo servidor. Aquí viven las escrituras con privilegios —
 * roles, consecutivos, totales, stock — porque no hay Cloud Functions
 * (SPEC.md §2.2, AGENTS.md §3).
 *
 * Contra los emuladores no hace falta cuenta de servicio: basta el projectId,
 * y los SDK se redirigen solos con FIREBASE_AUTH_EMULATOR_HOST y
 * FIRESTORE_EMULATOR_HOST.
 */
/**
 * Los SDK de servidor se dirigen a los emuladores mediante estas dos
 * variables. Se derivan del mismo interruptor que usa el cliente en vez de
 * dejarlas a mano: si se configuraran por separado, poner USE_EMULATORS en
 * false y olvidar quitarlas dejaría al servidor hablando con un emulador
 * apagado, y el fallo aparecería en producción.
 */
function ajustarEmuladores(): void {
  if (usarEmuladores()) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
    return;
  }

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
    throw new Error(
      "Configuración incoherente: NEXT_PUBLIC_FIREBASE_USE_EMULATORS no está en true pero siguen definidas FIREBASE_AUTH_EMULATOR_HOST o FIRESTORE_EMULATOR_HOST. Quítalas para apuntar al proyecto real.",
    );
  }
}

export function getFirebaseAdmin(): AdminFirebase {
  if (admin) return admin;

  ajustarEmuladores();
  const existente = getApps();
  const app =
    existente.length > 0
      ? (existente[0] as App)
      : initializeApp(
          usarEmuladores()
            ? { projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-jyl" }
            : { credential: cert(leerConfigAdmin()) },
        );

  admin = { app, auth: getAuth(app), db: getFirestore(app) };
  return admin;
}
