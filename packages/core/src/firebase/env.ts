import { z } from "zod";

/**
 * Nota: no hay `storageBucket` a propósito. Firebase Storage exige plan Blaze
 * desde el 3 de febrero de 2026 y este proyecto no lo usa (SPEC.md §2.2); las
 * imágenes van a Cloudinary. Omitirlo evita que alguien lo use por descuido.
 */
const configClienteSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
});

const configAdminSchema = z.object({
  projectId: z.string().min(1),
  clientEmail: z.string().min(1),
  privateKey: z.string().min(1),
});

export type ConfigCliente = z.infer<typeof configClienteSchema>;
export type ConfigAdmin = z.infer<typeof configAdminSchema>;

/** Las variables NEXT_PUBLIC_ se leen una a una: Next las sustituye en tiempo
 *  de compilación y un acceso dinámico no se reemplazaría. */
function variablesCliente() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function usarEmuladores(): boolean {
  return process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true";
}

/** Se valida al inicializar, no al importar: así compilar no exige que las
 *  variables existan y el error, si falta alguna, dice cuál. */
export function leerConfigCliente(): ConfigCliente {
  const resultado = configClienteSchema.safeParse(variablesCliente());
  if (!resultado.success) {
    const faltantes = resultado.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Falta configuración de Firebase para el cliente (${faltantes}). Copia .env.example a .env.local y rellena los valores de la consola de Firebase.`,
    );
  }
  return resultado.data;
}

export function leerConfigAdmin(): ConfigAdmin {
  const resultado = configAdminSchema.safeParse({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    // En el .env la clave viaja con los saltos de línea escapados.
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  });
  if (!resultado.success) {
    const faltantes = resultado.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(
      `Falta la cuenta de servicio de Firebase (${faltantes}). Genérala en la consola y ponla en .env.local; nunca en el código ni en una variable NEXT_PUBLIC_.`,
    );
  }
  return resultado.data;
}
