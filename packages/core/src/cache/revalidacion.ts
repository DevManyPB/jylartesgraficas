import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * Qué cachea el sitio público y con qué etiqueta. El panel avisa usando estos
 * mismos nombres, así que una etiqueta mal escrita en un lado no puede pasar
 * desapercibida: no compila.
 */
export const ETIQUETAS_CACHE = ["servicios", "configuracion", "portafolio", "productos"] as const;
export type EtiquetaCache = (typeof ETIQUETAS_CACHE)[number];

/** Compara el secreto sin revelar por el tiempo de respuesta cuánto acertó. */
export function secretoValido(recibido: string | null, esperado: string | undefined): boolean {
  if (!recibido || !esperado) return false;
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Avisa al sitio público que algo cambió, para que lo muestre ya y no dentro
 * de una hora. Nunca lanza ni hace esperar más de 3 s: si el aviso falla, lo
 * guardado sigue guardado, y el sitio se pone al día solo cuando caduque su
 * caché. Devuelve si el aviso llegó, para poder registrarlo.
 */
export async function avisarAlSitio(etiquetas: EtiquetaCache[]): Promise<boolean> {
  const url = process.env.SITIO_URL;
  const secreto = process.env.REVALIDACION_SECRETO;
  if (!url || !secreto) return false;

  try {
    const respuesta = await fetch(new URL("/api/revalidar", url), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secreto}` },
      body: JSON.stringify({ etiquetas }),
      signal: AbortSignal.timeout(3000),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}
