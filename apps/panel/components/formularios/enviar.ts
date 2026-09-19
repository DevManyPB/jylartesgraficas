"use client";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export type ResultadoEnvio<T> =
  | { ok: true; datos: T }
  | { ok: false; error: string; campos?: Record<string, string> };

/**
 * Envía JSON a una Route Handler del panel y devuelve el resultado ya
 * interpretado. Nunca lanza: un corte de red se convierte en un error con
 * mensaje, porque quien llama siempre tiene que poder decir algo útil.
 */
export async function enviarJson<T = unknown>(
  url: string,
  metodo: "POST" | "PUT",
  cuerpo: unknown,
): Promise<ResultadoEnvio<T>> {
  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const datos = (await respuesta.json().catch(() => ({}))) as Record<string, unknown>;

    if (respuesta.ok) return { ok: true, datos: datos as T };

    if (respuesta.status === 401) {
      return { ok: false, error: "Tu sesión terminó. Vuelve a entrar para guardar." };
    }
    return {
      ok: false,
      error: typeof datos.error === "string" ? datos.error : "No se pudo guardar. Inténtalo de nuevo.",
      campos: datos.campos as Record<string, string> | undefined,
    };
  } catch {
    return { ok: false, error: "No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo." };
  }
}

/** Pinta junto a cada campo los errores que devolvió el servidor. */
export function aplicarErroresDelServidor<T extends FieldValues>(
  campos: Record<string, string> | undefined,
  setError: UseFormSetError<T>,
): void {
  if (!campos) return;
  let primero = true;
  for (const [campo, mensaje] of Object.entries(campos)) {
    setError(campo as Path<T>, { type: "server", message: mensaje }, { shouldFocus: primero });
    primero = false;
  }
}

/**
 * Para `register(..., { setValueAs })`: un campo numérico vacío es null, y la
 * coma decimal se acepta (en Colombia se escribe 10,4 y no 10.4). Si lo
 * escrito no es un número se deja pasar tal cual, para que el esquema diga
 * qué está mal en vez de convertirlo en silencio.
 */
export function numeroONulo(valor: unknown): unknown {
  if (valor === "" || valor === null || valor === undefined) return null;
  if (typeof valor === "number") return valor;
  const numero = Number(String(valor).trim().replace(",", "."));
  return Number.isNaN(numero) ? valor : numero;
}
