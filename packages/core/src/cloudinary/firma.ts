import { createHash } from "node:crypto";

/**
 * Firma de subida de Cloudinary.
 *
 * El procedimiento está en https://cloudinary.com/documentation/signatures:
 * se toman todos los parámetros del POST menos `file`, `cloud_name`,
 * `resource_type` y `api_key`; se ordenan alfabéticamente por nombre; se unen
 * como `clave=valor` separados por `&`; se concatena el API secret al final
 * sin separador; y se hashea. El algoritmo por defecto es SHA-1.
 */
export function firmarParametros(
  parametros: Record<string, string | number>,
  apiSecret: string,
): string {
  const serializado = Object.keys(parametros)
    .sort()
    .map((clave) => `${clave}=${parametros[clave]}`)
    .join("&");

  return createHash("sha1")
    .update(serializado + apiSecret)
    .digest("hex");
}

/** Lo que el navegador necesita para subir directo a Cloudinary. */
export interface PermisoDeSubida {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
}

/**
 * Crea el permiso para subir **un** archivo. La carpeta y el public_id los
 * decide quien llama (el servidor), nunca el navegador: si el cliente pudiera
 * elegir el public_id podría sobrescribir un asset que ya existe.
 */
export function crearPermisoDeSubida(opciones: {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  publicId: string;
  /** Inyectable para poder probarlo con un valor fijo. */
  timestamp?: number;
}): PermisoDeSubida {
  const timestamp = opciones.timestamp ?? Math.floor(Date.now() / 1000);

  const firmados = {
    folder: opciones.folder,
    public_id: opciones.publicId,
    timestamp,
  };

  return {
    cloudName: opciones.cloudName,
    apiKey: opciones.apiKey,
    timestamp,
    signature: firmarParametros(firmados, opciones.apiSecret),
    folder: opciones.folder,
    publicId: opciones.publicId,
  };
}
