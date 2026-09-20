"use client";

import { useToast } from "@jyl/ui";
import { useRouter } from "next/navigation";
import { useState, type DragEvent } from "react";
import { enviarJson } from "@/components/formularios/enviar";

interface Ordenable {
  id: string;
}

/**
 * Ordenar arrastrando — SPEC.md §6.7. Se queda con el orden que se ve en
 * pantalla y lo manda entero; el servidor reparte entre esos documentos los
 * `orden` que ya tenían, así que las demás páginas de la lista no se mueven.
 *
 * Los botones Subir y Bajar siguen existiendo: son la forma de hacerlo con
 * el teclado, y en un móvil arrastrar una lista larga es incómodo.
 */
export function useOrdenArrastrable<T extends Ordenable>(elementos: T[], endpoint: string) {
  const { toast } = useToast();
  const router = useRouter();
  const [orden, setOrden] = useState<string[] | null>(null);
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [encima, setEncima] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Mientras no se arrastre nada, manda lo que llegó del servidor.
  const enPantalla = orden
    ? orden.flatMap((id) => elementos.find((e) => e.id === id) ?? [])
    : elementos;

  async function guardar(ids: string[]) {
    setGuardando(true);
    const r = await enviarJson(endpoint, "PUT", { ids });
    setGuardando(false);

    if (!r.ok) {
      setOrden(null);
      toast({ title: "No se guardó el orden", description: r.error, variant: "error" });
    }
    router.refresh();
  }

  /**
   * El id de origen viaja en el propio evento, no en el estado: al soltar,
   * React puede no haber aplicado todavía lo que puso `onDragStart`.
   */
  function soltarSobre(origenId: string, destinoId: string) {
    setArrastrando(null);
    setEncima(null);
    if (!origenId || origenId === destinoId) return;

    const ids = enPantalla.map((e) => e.id);
    const desde = ids.indexOf(origenId);
    const hasta = ids.indexOf(destinoId);
    if (desde < 0 || hasta < 0) return;

    ids.splice(hasta, 0, ...ids.splice(desde, 1));
    setOrden(ids);
    void guardar(ids);
  }

  /** Atributos que hacen arrastrable cada fila de la lista. */
  const propsDeFila = (id: string) => ({
    draggable: !guardando,
    onDragStart: (e: DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      setArrastrando(id);
    },
    onDragOver: (e: DragEvent) => {
      e.preventDefault();
      setEncima(id);
    },
    onDragLeave: () => setEncima((actual) => (actual === id ? null : actual)),
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      soltarSobre(e.dataTransfer.getData("text/plain"), id);
    },
    onDragEnd: () => {
      setArrastrando(null);
      setEncima(null);
    },
  });

  return { enPantalla, propsDeFila, arrastrando, encima, guardando };
}
