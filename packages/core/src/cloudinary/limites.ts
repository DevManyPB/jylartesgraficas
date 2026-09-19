/**
 * Límites de subida en un solo sitio — SPEC.md §4.5 y AGENTS.md §5.
 * Se comprueban en el servidor contra lo que Cloudinary dice que recibió,
 * no contra lo que el navegador afirma haber enviado.
 */

export const MAX_ARCHIVOS_POR_PEDIDO = 10;
export const MAX_BYTES_POR_ARCHIVO = 10 * 1024 * 1024;

/** Formatos que acepta el formulario de pedido (SPEC.md §4.5, paso 3). */
export const FORMATOS_PERMITIDOS = ["jpg", "jpeg", "png", "webp", "pdf", "ai", "psd"] as const;

export type FormatoPermitido = (typeof FORMATOS_PERMITIDOS)[number];

/** Dónde vive cada cosa en Cloudinary. La carpeta la impone el servidor. */
export const CARPETAS = {
  pedidos: "jyl/pedidos",
  portafolio: "jyl/portafolio",
  productos: "jyl/productos",
} as const;

export type Carpeta = keyof typeof CARPETAS;

export function formatoPermitido(formato: string): formato is FormatoPermitido {
  return (FORMATOS_PERMITIDOS as readonly string[]).includes(formato.toLowerCase());
}

export interface ProblemaDeArchivo {
  motivo: "formato" | "tamaño";
  mensaje: string;
}

/**
 * Verdad final sobre si un archivo vale, a partir de los datos que devuelve
 * Cloudinary. Devuelve null si está bien.
 */
export function revisarArchivo(datos: {
  format: string;
  bytes: number;
}): ProblemaDeArchivo | null {
  if (!formatoPermitido(datos.format)) {
    return {
      motivo: "formato",
      mensaje: `El formato .${datos.format} no está permitido. Acepta ${FORMATOS_PERMITIDOS.join(", ")}.`,
    };
  }

  if (datos.bytes > MAX_BYTES_POR_ARCHIVO) {
    const mb = (datos.bytes / 1024 / 1024).toFixed(1);
    return {
      motivo: "tamaño",
      mensaje: `El archivo pesa ${mb} MB y el máximo es 10 MB. Quítalo o reemplázalo para continuar.`,
    };
  }

  return null;
}
