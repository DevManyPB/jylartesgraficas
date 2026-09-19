import "server-only";

import { getFirebaseAdmin } from "../firebase/admin";
import { rolDesdeClaims, type Rol } from "./roles";

export const COOKIE_SESION = "jyl_sesion";

/** Cinco días, el máximo que admite Firebase para una cookie de sesión. */
const DURACION_MS = 60 * 60 * 24 * 5 * 1000;

export interface Sesion {
  uid: string;
  email: string | null;
  nombre: string | null;
  rol: Rol | null;
}

export interface CookieSesion {
  nombre: string;
  valor: string;
  opciones: {
    httpOnly: true;
    secure: boolean;
    sameSite: "lax";
    path: "/";
    maxAge: number;
  };
}

/**
 * Cambia el idToken que produjo el login por una cookie de sesión firmada.
 * Va en httpOnly para que el JavaScript de la página no pueda leerla.
 */
export async function crearCookieSesion(idToken: string): Promise<CookieSesion> {
  const { auth } = getFirebaseAdmin();
  const valor = await auth.createSessionCookie(idToken, { expiresIn: DURACION_MS });

  return {
    nombre: COOKIE_SESION,
    valor,
    opciones: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DURACION_MS / 1000,
    },
  };
}

/**
 * Verifica la cookie contra Firebase y devuelve quién es. `null` si no hay
 * cookie, está caducada, o la sesión fue revocada.
 */
export async function leerSesion(valorCookie: string | undefined): Promise<Sesion | null> {
  if (!valorCookie) return null;

  try {
    const { auth } = getFirebaseAdmin();
    const claims = await auth.verifySessionCookie(valorCookie, true);

    return {
      uid: claims.uid,
      email: claims.email ?? null,
      nombre: (claims.name as string | undefined) ?? null,
      rol: rolDesdeClaims(claims),
    };
  } catch {
    // Cookie inválida, caducada o revocada: se trata como no haber entrado.
    return null;
  }
}

export function cookieDeCierre(): CookieSesion {
  return {
    nombre: COOKIE_SESION,
    valor: "",
    opciones: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    },
  };
}
