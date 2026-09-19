/**
 * Deja el emulador listo para trabajar en el panel: una cuenta de admin y una
 * de operador, con su rol, y el catálogo de servicios sembrado.
 *
 * El emulador arranca vacío cada vez, y sin una cuenta con rol no se puede
 * entrar al panel. Esto evita rehacer a mano los mismos pasos.
 *
 *   node --env-file=apps/web/.env.local scripts/preparar-emulador.mjs
 *
 * Contraseña de las dos cuentas: prueba123. Solo existen en el emulador.
 */
import { execFileSync } from "node:child_process";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Sin esto el Admin SDK hablaría con el proyecto real. Se fijan aquí y no se
// leen del entorno para que no haya forma de apuntar este script a producción.
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Falta FIREBASE_ADMIN_PROJECT_ID. Lánzalo con --env-file=apps/web/.env.local");
  process.exit(1);
}

initializeApp({ projectId });
const auth = getAuth();
const db = getFirestore();

const CUENTAS = [
  { email: "admin@jyl.test", nombre: "Admin de prueba", rol: "admin" },
  { email: "operador@jyl.test", nombre: "Operador de prueba", rol: "operador" },
];

for (const cuenta of CUENTAS) {
  let usuario;
  try {
    usuario = await auth.getUserByEmail(cuenta.email);
  } catch {
    usuario = await auth.createUser({
      email: cuenta.email,
      password: "prueba123",
      displayName: cuenta.nombre,
    });
  }
  await auth.setCustomUserClaims(usuario.uid, { role: cuenta.rol });
  await db.collection("users").doc(usuario.uid).set(
    { nombre: cuenta.nombre, email: cuenta.email, role: cuenta.rol },
    { merge: true },
  );
  console.log(`${cuenta.rol.padEnd(8)} ${cuenta.email}`);
}

// La siembra ya existe como script propio; se reutiliza en vez de duplicarla.
execFileSync(process.execPath, [new URL("./seed-servicios.mjs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")], {
  stdio: "inherit",
  env: process.env,
});

console.log(`\nListo en ${projectId} (emulador). Contraseña de ambas cuentas: prueba123`);
