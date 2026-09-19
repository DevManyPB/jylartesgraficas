import "server-only";

import { esPersonal, type RolDelPersonal } from "@jyl/core";
import { COOKIE_SESION, leerSesion, type Sesion } from "@jyl/core/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/** Sesión de quien hace la petición, o null. */
export async function sesionActual(): Promise<Sesion | null> {
  return leerSesion((await cookies()).get(COOKIE_SESION)?.value);
}

export type SesionDelPersonal = Sesion & { rol: RolDelPersonal };

type ResultadoGuardia =
  | { ok: true; sesion: SesionDelPersonal }
  | { ok: false; respuesta: NextResponse };

/**
 * Guardia de las Route Handlers del panel.
 *
 * Todas las escrituras del panel pasan por aquí (decisión de la Fase 3): el
 * servidor comprueba la sesión y el rol antes de tocar Firestore con
 * firebase-admin, que no pasa por firestore.rules. Si esta comprobación
 * faltara en un endpoint, ese endpoint quedaría abierto — por eso se escribe
 * una vez y cada handler la llama en su primera línea.
 *
 * ```ts
 * const guardia = await exigirRol(["admin"]);
 * if (!guardia.ok) return guardia.respuesta;
 * ```
 */
export async function exigirRol(permitidos: readonly RolDelPersonal[]): Promise<ResultadoGuardia> {
  const sesion = await sesionActual();

  if (!sesion) {
    return {
      ok: false,
      respuesta: NextResponse.json({ error: "Tu sesión terminó. Vuelve a entrar." }, { status: 401 }),
    };
  }

  if (!esPersonal(sesion.rol) || !permitidos.includes(sesion.rol)) {
    return {
      ok: false,
      respuesta: NextResponse.json(
        { error: "Tu rol no permite hacer esto." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, sesion: { ...sesion, rol: sesion.rol } };
}

/**
 * Guardia de las páginas con rol restringido. El layout privado ya exige ser
 * del personal; esto va un paso más allá para las secciones solo de admin.
 * A quien no le corresponde se le manda al tablero: la sección tampoco le
 * aparece en el menú, así que solo llega escribiendo la dirección a mano.
 */
export async function paginaSoloPara(permitidos: readonly RolDelPersonal[]): Promise<SesionDelPersonal> {
  const sesion = await sesionActual();
  if (!sesion) redirect("/entrar");
  if (!esPersonal(sesion.rol) || !permitidos.includes(sesion.rol)) redirect("/");
  return { ...sesion, rol: sesion.rol };
}

