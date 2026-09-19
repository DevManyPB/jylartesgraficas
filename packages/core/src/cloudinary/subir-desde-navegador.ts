/**
 * Sube un archivo directo a Cloudinary con la firma que da nuestro servidor.
 *
 * Usa XMLHttpRequest y no fetch a propósito: fetch no informa del progreso de
 * subida, y SPEC.md §4.5 pide una barra de progreso real por archivo. El
 * archivo no pasa por nuestro servidor (ver Chunk F).
 *
 * Lo usan el formulario de pedido del sitio y el panel (fotos de productos y
 * del portafolio); cada uno con su propio endpoint de firma, que es quien
 * decide quién puede subir y a qué carpeta.
 */

export interface PermisoDeSubidaNavegador {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
}

export interface RespuestaCloudinary {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

export async function pedirPermiso(
  destino: "pedidos" | "portafolio" | "productos",
  endpoint = "/api/subidas/firma",
): Promise<PermisoDeSubidaNavegador> {
  const respuesta = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destino }),
  });
  if (!respuesta.ok) throw new Error("No pudimos preparar la subida.");
  return (await respuesta.json()) as PermisoDeSubidaNavegador;
}

export function subirACloudinary(
  archivo: File,
  permiso: PermisoDeSubidaNavegador,
  onProgreso: (porcentaje: number) => void,
  senal?: AbortSignal,
): Promise<RespuestaCloudinary> {
  return new Promise((resolver, rechazar) => {
    const datos = new FormData();
    datos.append("file", archivo);
    datos.append("api_key", permiso.apiKey);
    datos.append("timestamp", String(permiso.timestamp));
    datos.append("folder", permiso.folder);
    datos.append("public_id", permiso.publicId);
    datos.append("signature", permiso.signature);

    const peticion = new XMLHttpRequest();
    // `auto` deja que Cloudinary acepte también PDF, AI y PSD, que no son
    // imágenes para su API pero sí formatos válidos aquí (SPEC.md §4.5).
    peticion.open("POST", `https://api.cloudinary.com/v1_1/${permiso.cloudName}/auto/upload`);

    peticion.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        onProgreso(Math.round((evento.loaded / evento.total) * 100));
      }
    };

    peticion.onload = () => {
      if (peticion.status >= 200 && peticion.status < 300) {
        resolver(JSON.parse(peticion.responseText) as RespuestaCloudinary);
      } else {
        rechazar(new Error("Cloudinary rechazó el archivo."));
      }
    };

    peticion.onerror = () => rechazar(new Error("Se cortó la conexión durante la subida."));
    peticion.onabort = () => rechazar(new DOMException("Subida cancelada", "AbortError"));

    senal?.addEventListener("abort", () => peticion.abort(), { once: true });

    peticion.send(datos);
  });
}
