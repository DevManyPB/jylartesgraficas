/**
 * Concede el primer rol de admin: el endpoint protegido del panel exige ya ser
 * admin para asignar roles, así que el primero hay que darlo desde fuera.
 *
 * Contra los emuladores (con `pnpm emulators` levantado):
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
 *     node scripts/set-admin.mjs correo@ejemplo.com
 *
 * Contra el proyecto real, con la cuenta de servicio en las variables de
 * entorno (FIREBASE_ADMIN_*):
 *   node scripts/set-admin.mjs correo@ejemplo.com
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/set-admin.mjs <correo>");
  process.exit(1);
}

const usandoEmuladores = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  "demo-jyl";

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

const auth = getAuth();
const usuario = await auth.getUserByEmail(email);

await auth.setCustomUserClaims(usuario.uid, { role: "admin" });
await getFirestore().collection("users").doc(usuario.uid).set({ role: "admin" }, { merge: true });
await auth.revokeRefreshTokens(usuario.uid);

console.log(
  `Listo: ${email} (${usuario.uid}) es admin${usandoEmuladores ? " en el emulador" : ""}.`,
);
console.log("Tiene que volver a entrar para que su sesión recoja el rol nuevo.");
