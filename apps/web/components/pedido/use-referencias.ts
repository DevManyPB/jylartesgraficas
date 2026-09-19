"use client";

import {
  FORMATOS_PERMITIDOS,
  MAX_ARCHIVOS_POR_PEDIDO,
  MAX_BYTES_POR_ARCHIVO,
  formatoPermitido,
  pedirPermiso,
  subirACloudinary,
} from "@jyl/core";
import { useCallback, useRef, useState } from "react";

export interface Referencia {
  /** Identificador local; el de Cloudinary llega al terminar. */
  id: string;
  nombre: string;
  bytes: number;
  /** Solo para imágenes: object URL para la vista previa. */
  vistaPrevia: string | null;
  estado: "subiendo" | "listo" | "error";
  progreso: number;
  publicId: string | null;
  error: string | null;
}

function extensionDe(nombre: string): string {
  return nombre.split(".").pop()?.toLowerCase() ?? "";
}

/** Revisión rápida en el navegador. La de verdad la hace el servidor. */
function revisar(archivo: File): string | null {
  if (!formatoPermitido(extensionDe(archivo.name))) {
    return `No aceptamos archivos .${extensionDe(archivo.name)}. Usa ${FORMATOS_PERMITIDOS.join(", ")}.`;
  }
  if (archivo.size > MAX_BYTES_POR_ARCHIVO) {
    return `Pesa ${(archivo.size / 1024 / 1024).toFixed(1)} MB y el máximo es 10 MB.`;
  }
  return null;
}

export function useReferencias() {
  const [referencias, setReferencias] = useState<Referencia[]>([]);
  const controladores = useRef(new Map<string, AbortController>());
  /**
   * Cuántas hay ya aceptadas. Se lleva aparte del estado a propósito: decidir
   * el cupo dentro del `setReferencias` obligaría a lanzar las subidas dentro
   * del actualizador, y React ejecuta los actualizadores dos veces en
   * desarrollo — cada archivo se subiría por duplicado.
   */
  const cantidad = useRef(0);

  const actualizar = useCallback((id: string, cambios: Partial<Referencia>) => {
    setReferencias((previas) =>
      previas.map((r) => (r.id === id ? { ...r, ...cambios } : r)),
    );
  }, []);

  const subir = useCallback(
    async (archivo: File, id: string) => {
      const controlador = new AbortController();
      controladores.current.set(id, controlador);
      try {
        const permiso = await pedirPermiso("pedidos");
        const resultado = await subirACloudinary(
          archivo,
          permiso,
          (progreso) => actualizar(id, { progreso }),
          controlador.signal,
        );
        actualizar(id, { estado: "listo", progreso: 100, publicId: resultado.public_id });
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        actualizar(id, {
          estado: "error",
          error: "No se pudo subir. Quítalo e inténtalo de nuevo.",
        });
      } finally {
        controladores.current.delete(id);
      }
    },
    [actualizar],
  );

  const agregar = useCallback(
    (archivos: File[]) => {
      const espacio = Math.max(MAX_ARCHIVOS_POR_PEDIDO - cantidad.current, 0);
      const admitidos = archivos.slice(0, espacio);
      if (admitidos.length === 0) return;

      const nuevas = admitidos.map((archivo): Referencia => {
        const problema = revisar(archivo);
        return {
          id: crypto.randomUUID(),
          nombre: archivo.name,
          bytes: archivo.size,
          vistaPrevia: archivo.type.startsWith("image/") ? URL.createObjectURL(archivo) : null,
          estado: problema ? "error" : "subiendo",
          progreso: 0,
          publicId: null,
          error: problema,
        };
      });

      cantidad.current += nuevas.length;
      setReferencias((previas) => [...previas, ...nuevas]);

      nuevas.forEach((referencia, indice) => {
        if (referencia.estado === "subiendo") void subir(admitidos[indice]!, referencia.id);
      });
    },
    [subir],
  );

  const quitar = useCallback((id: string) => {
    controladores.current.get(id)?.abort();
    controladores.current.delete(id);
    cantidad.current = Math.max(cantidad.current - 1, 0);
    setReferencias((previas) => {
      const objetivo = previas.find((r) => r.id === id);
      if (objetivo?.vistaPrevia) URL.revokeObjectURL(objetivo.vistaPrevia);
      return previas.filter((r) => r.id !== id);
    });
  }, []);

  const publicIds = referencias.flatMap((r) => (r.publicId ? [r.publicId] : []));
  const subiendo = referencias.some((r) => r.estado === "subiendo");

  return { referencias, agregar, quitar, publicIds, subiendo };
}
