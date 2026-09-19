import "server-only";

import { leerConfigCloudinary } from "./env";
import { revisarArchivo, type ProblemaDeArchivo } from "./limites";

/** Lo que se guarda en Firestore. Nunca el binario — SPEC.md §2.3. */
export interface ArchivoSubido {
  publicId: string;
  url: string;
  formato: string;
  bytes: number;
  ancho: number | null;
  alto: number | null;
}

export type ResultadoVerificacion =
  | { ok: true; archivo: ArchivoSubido }
  | { ok: false; problema: ProblemaDeArchivo };

/**
 * Dónde puede haber quedado un archivo. El formulario sube por el endpoint
 * `auto`, así que el tipo lo decide Cloudinary según el contenido: los JPG y
 * PNG caen siempre en `image`, y un PDF o un AI casi siempre también — pero
 * "casi siempre" no basta, y buscar en el sitio equivocado devuelve un 404
 * que no se distingue de "no subió nada".
 */
const TIPOS = ["image", "raw"] as const;

type TipoDeRecurso = (typeof TIPOS)[number];

interface RecursoCloudinary {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

function cabeceraDeAutenticacion(apiKey: string, apiSecret: string): string {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`;
}

async function buscarRecurso(
  publicId: string,
  tipo: TipoDeRecurso,
): Promise<RecursoCloudinary | null> {
  const { cloudName, apiKey, apiSecret } = leerConfigCloudinary();

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/resources/${tipo}/upload/${encodeURIComponent(publicId)}`,
    { headers: { Authorization: cabeceraDeAutenticacion(apiKey, apiSecret) } },
  );

  return respuesta.ok ? ((await respuesta.json()) as RecursoCloudinary) : null;
}

/**
 * Esperas entre intentos cuando el archivo aún no aparece.
 *
 * La API de administración de Cloudinary no ve el recurso en el mismo
 * instante en que termina la subida: probando el formulario, un pedido
 * enviado unos segundos después de subir quedó marcado como incompleto, y el
 * mismo identificador respondió sin problema un minuto más tarde. Como quien
 * pide desde el móvil adjunta y envía enseguida, ese hueco sería el caso
 * normal, no la excepción. Solo cuesta tiempo cuando de verdad no hay nada.
 */
const ESPERAS_MS = [400, 1200];

const dormir = (ms: number) => new Promise((seguir) => setTimeout(seguir, ms));

/**
 * Le pregunta a Cloudinary qué llegó de verdad y decide si vale.
 *
 * Esto es lo que hace cierto el "límites verificados en el servidor" de
 * AGENTS.md §5: el navegador puede decir misa, pero el formato y el peso se
 * leen de la fuente. Si incumple, el archivo se borra en vez de quedar
 * ocupando cuota.
 *
 * Sin `tipo` se busca en todos los que usa el formulario, en orden. Con `tipo`
 * se busca solo ahí, que es lo que quiere el panel cuando ya lo sabe.
 */
export async function verificarSubida(
  publicId: string,
  tipo?: TipoDeRecurso,
): Promise<ResultadoVerificacion> {
  const donde = tipo ? [tipo] : TIPOS;

  let datos: RecursoCloudinary | null = null;
  let encontradoEn: TipoDeRecurso = "image";

  for (let intento = 0; intento <= ESPERAS_MS.length && !datos; intento += 1) {
    if (intento > 0) await dormir(ESPERAS_MS[intento - 1]!);

    for (const candidato of donde) {
      datos = await buscarRecurso(publicId, candidato);
      if (datos) {
        encontradoEn = candidato;
        break;
      }
    }
  }

  if (!datos) {
    return {
      ok: false,
      problema: { motivo: "formato", mensaje: "No encontramos el archivo que dices haber subido." },
    };
  }

  const problema = revisarArchivo(datos);
  if (problema) {
    await borrarSubida(datos.public_id, encontradoEn);
    return { ok: false, problema };
  }

  return {
    ok: true,
    archivo: {
      publicId: datos.public_id,
      url: datos.secure_url,
      formato: datos.format,
      bytes: datos.bytes,
      ancho: datos.width ?? null,
      alto: datos.height ?? null,
    },
  };
}

export async function borrarSubida(
  publicId: string,
  tipo: TipoDeRecurso = "image",
): Promise<void> {
  const { cloudName, apiKey, apiSecret } = leerConfigCloudinary();

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/${tipo}/upload`, {
    method: "DELETE",
    headers: {
      Authorization: cabeceraDeAutenticacion(apiKey, apiSecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ public_ids: [publicId] }),
  });
}
