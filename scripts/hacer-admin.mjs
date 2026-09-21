/**
 * Da el rol de administrador a una cuenta que ya existe en Authentication.
 *
 * Hace falta para arrancar: el rol vive en un custom claim, que solo puede
 * escribir el Admin SDK, y sin una cuenta con rol no se entra al panel. En el
 * emulador lo resuelve `preparar-emulador.mjs`; en el proyecto real, esto.
 *
 * Primero entra con Google (o con correo y contraseña) en el sitio público:
 * así nace la cuenta. Luego:
 *
 *   node --env-file=apps/web/.env.local scripts/hacer-admin.mjs
 *
 * Sin argumentos lista las cuentas que hay. Con un correo, le pone el rol:
 *
 *   node --env-file=apps/web/.env.local scripts/hacer-admin.mjs tu@correo.com
 *
 * Nunca crea cuentas ni contraseñas. Contra el proyecto real necesita la
 * cuenta de servicio en las variables de entorno; contra el emulador basta
 * con que esté levantado.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const ROLES = ["admin", "operador", "cliente"];

const usandoEmuladores = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true";
if (usandoEmuladores) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("Falta FIREBASE_ADMIN_PROJECT_ID. Lánzalo con --env-file=apps/web/.env.local");
  process.exit(1);
}

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
const db = getFirestore();
const donde = usandoEmuladores ? "emulador" : "proyecto real";
const [email, rolPedido = "admin"] = process.argv.slice(2);

if (!email) {
  const lista = await auth.listUsers(100);
  console.log(`Cuentas en ${projectId} (${donde}): ${lista.users.length}`);
  for (const usuario of lista.users) {
    const proveedores = usuario.providerData.map((p) => p.providerId).join(", ") || "sin proveedor";
    console.log(`  ${(usuario.email ?? "(sin correo)").padEnd(34)} rol=${usuario.customClaims?.role ?? "ninguno"}  (${proveedores})`);
  }
  if (lista.users.length === 0) {
    console.log("\nNo hay ninguna. Entra primero en el sitio público para que nazca la cuenta.");
  } else {
    console.log("\nVuelve a lanzarlo con el correo al que quieras darle el rol.");
  }
  process.exit(0);
}

if (!ROLES.includes(rolPedido)) {
  console.error(`Rol desconocido: ${rolPedido}. Los que hay son ${ROLES.join(", ")}.`);
  process.exit(1);
}

const usuario = await auth.getUserByEmail(email).catch(() => null);
if (!usuario) {
  console.error(`No hay ninguna cuenta con ${email} en ${projectId}. Entra primero en el sitio para crearla.`);
  process.exit(1);
}

await auth.setCustomUserClaims(usuario.uid, { role: rolPedido });
// El documento de `users` es lo que lee el panel para mostrar la persona; el
// claim es lo que decide el permiso. Los dos tienen que decir lo mismo.
await db.collection("users").doc(usuario.uid).set(
  {
    nombre: usuario.displayName ?? email,
    email,
    role: rolPedido,
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);

console.log(`${email} ahora es ${rolPedido} en ${projectId} (${donde}).`);
console.log("Cierra sesión y vuelve a entrar: el rol viaja dentro del token y el que tienes abierto todavía no lo lleva.");
