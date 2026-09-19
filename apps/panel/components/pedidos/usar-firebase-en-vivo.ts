"use client";

import { getFirebase } from "@jyl/core";
import { onAuthStateChanged, signInWithCustomToken, type User } from "firebase/auth";
import { useEffect, useState } from "react";

/**
 * Deja el SDK de cliente autenticado como la misma persona que la cookie de
 * sesión, y avisa cuando está listo. Si ya lo estaba (entró por el login del
 * panel) no hace nada; si no —otra pestaña cerró sesión, se limpió el
 * almacenamiento, o la sesión es de otra persona— canjea la cookie por un
 * token (ver /api/session/token).
 */
export function useFirebaseEnVivo(uid: string): { listo: boolean; error: boolean } {
  const [usuario, setUsuario] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    const { auth } = getFirebase();
    return onAuthStateChanged(auth, setUsuario);
  }, []);

  useEffect(() => {
    // `undefined`: Firebase aún no sabe si había sesión guardada.
    if (usuario === undefined || usuario?.uid === uid) return;

    let cancelado = false;
    (async () => {
      try {
        const respuesta = await fetch("/api/session/token", { method: "POST" });
        if (!respuesta.ok) throw new Error("token");
        const { token } = (await respuesta.json()) as { token: string };
        if (!cancelado) await signInWithCustomToken(getFirebase().auth, token);
      } catch {
        if (!cancelado) setError(true);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [usuario, uid]);

  return { listo: usuario?.uid === uid, error };
}
