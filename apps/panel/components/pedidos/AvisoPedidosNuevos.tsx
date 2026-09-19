"use client";

import { getFirebase } from "@jyl/core";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFirebaseEnVivo } from "./usar-firebase-en-vivo";

interface AvisoPedidosNuevosProps {
  uid: string;
  /**
   * Si la vista muestra los pedidos más recientes (primera página, sin
   * filtro o filtrando por "Recibido"). Solo entonces se refresca sola: en
   * otra página, meter filas de golpe movería lo que la persona está leyendo.
   */
  refrescarSola: boolean;
}

/**
 * Pedidos nuevos sin recargar — SPEC.md §13: "el administrador ve el pedido
 * nuevo en menos de 5 segundos".
 *
 * Escucha un único documento —el pedido más reciente— y no la colección:
 * AGENTS.md §5 prohíbe `onSnapshot` sobre colecciones completas, y así cada
 * pedido nuevo cuesta una lectura en vez de veinticinco.
 */
export function AvisoPedidosNuevos({ uid, refrescarSola }: AvisoPedidosNuevosProps) {
  const router = useRouter();
  const { listo, error } = useFirebaseEnVivo(uid);
  const ultimoVisto = useRef<string | null>(null);
  const [anuncio, setAnuncio] = useState("");
  const [pendientes, setPendientes] = useState(0);

  useEffect(() => {
    if (!listo) return;
    const { db } = getFirebase();
    const masReciente = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(1));

    return onSnapshot(masReciente, (instantanea) => {
      const documento = instantanea.docs[0];
      if (!documento) return;

      // La primera respuesta solo fija desde dónde contar.
      if (ultimoVisto.current === null) {
        ultimoVisto.current = documento.id;
        return;
      }
      if (documento.id === ultimoVisto.current) return;
      ultimoVisto.current = documento.id;

      const numero = String(documento.data().numero ?? "");
      setAnuncio(`Llegó el pedido ${numero}.`);
      if (refrescarSola) router.refresh();
      else setPendientes((n) => n + 1);
    });
  }, [listo, refrescarSola, router]);

  return (
    <>
      {/* Lo oye quien usa lector de pantalla, sin mover el foco. */}
      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>

      {pendientes > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-ink">
          {pendientes === 1 ? "Llegó un pedido nuevo." : `Llegaron ${pendientes} pedidos nuevos.`}
          <Link href="/pedidos" className="font-medium text-accent underline-offset-2 hover:underline">
            Ver los más recientes
          </Link>
        </div>
      )}

      {error && (
        <p className="text-xs text-ink-muted">
          La actualización en vivo no está disponible; recarga la página para ver pedidos nuevos.
        </p>
      )}
    </>
  );
}
