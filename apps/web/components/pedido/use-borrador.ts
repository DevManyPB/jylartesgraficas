"use client";

import { useCallback } from "react";

const CLAVE = "jyl:borrador-pedido";

/**
 * Borrador del formulario en localStorage — SPEC.md §4.5.
 *
 * Son tres funciones sin estado propio: quien lo usa decide cuándo leer y qué
 * hacer con lo leído. Todo va envuelto en try/catch porque en navegación
 * privada, o con el almacenamiento bloqueado, `localStorage` lanza; si eso
 * pasa el formulario sigue funcionando, solo que sin borrador.
 */
export function useBorrador<T extends object>() {
  const leer = useCallback((): Partial<T> | null => {
    try {
      const guardado = window.localStorage.getItem(CLAVE);
      return guardado ? (JSON.parse(guardado) as Partial<T>) : null;
    } catch {
      return null;
    }
  }, []);

  const guardar = useCallback((valores: Partial<T>) => {
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify(valores));
    } catch {
      // Perder el borrador no puede romper el envío.
    }
  }, []);

  const limpiar = useCallback(() => {
    try {
      window.localStorage.removeItem(CLAVE);
    } catch {
      // Nada que hacer.
    }
  }, []);

  return { leer, guardar, limpiar };
}
