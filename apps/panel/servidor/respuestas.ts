import "server-only";

import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Respuesta de error que entiende `enviarFormulario` en el cliente. */
export interface RespuestaDeError {
  error: string;
  /** Mensaje por campo, con la ruta en puntos: `direccion.lat`, `horarios.0.cierra`. */
  campos?: Record<string, string>;
}

/**
 * 400 con un mensaje por campo. El formulario ya valida con el mismo esquema,
 * así que llegar aquí es raro — pero si pasa, el error aparece junto al campo
 * y no como un "algo salió mal" genérico.
 */
export function datosInvalidos(error: ZodError): NextResponse<RespuestaDeError> {
  const campos: Record<string, string> = {};
  for (const issue of error.issues) campos[issue.path.join(".")] ??= issue.message;

  return NextResponse.json(
    { error: "Hay datos por corregir.", campos },
    { status: 400 },
  );
}

export function errorDelServidor(mensaje: string): NextResponse<RespuestaDeError> {
  return NextResponse.json({ error: mensaje }, { status: 500 });
}

/** 404 o 409 con el mensaje que explica por qué no se pudo. */
export function rechazo(resultado: { estado: 404 | 409; mensaje: string }): NextResponse<RespuestaDeError> {
  return NextResponse.json({ error: resultado.mensaje }, { status: resultado.estado });
}
