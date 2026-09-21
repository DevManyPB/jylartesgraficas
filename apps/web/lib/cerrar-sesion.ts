import { getFirebase } from "@jyl/core";
import { signOut } from "firebase/auth";

/**
 * Salir de verdad son dos cosas, y las dos importan: apagar la sesión del SDK
 * en el navegador y borrar la cookie de sesión del servidor, que es la que
 * hace que las páginas se pinten como "con sesión". Si solo se hiciera una,
 * el usuario parecería fuera y seguiría dentro, o al revés.
 *
 * Lo usan el menú de la cuenta en el header y el botón de «Mi cuenta».
 */
export async function cerrarSesion(): Promise<void> {
  const { auth } = getFirebase();
  await signOut(auth);
  await fetch("/api/session", { method: "DELETE" });
}
