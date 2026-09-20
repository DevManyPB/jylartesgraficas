"use client";

import { miniaturaDesdeUrl, type ProyectoDelPanel } from "@jyl/core";
import { cn, useToast } from "@jyl/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrdenArrastrable } from "@/components/catalogo/usar-orden-arrastrable";
import { enviarJson } from "@/components/formularios/enviar";

/** El portafolio en el orden en que lo ve el público. */
export function ListaProyectos({ proyectos }: { proyectos: ProyectoDelPanel[] }) {
  const { toast } = useToast();
  const router = useRouter();
  const [moviendo, setMoviendo] = useState<string | null>(null);
  const { enPantalla, propsDeFila, arrastrando, encima, guardando } = useOrdenArrastrable(
    proyectos,
    "/api/portafolio/orden",
  );

  async function mover(id: string, direccion: -1 | 1) {
    if (moviendo) return;
    setMoviendo(id);
    const r = await enviarJson(`/api/portafolio/${id}/mover`, "PUT", { direccion });
    setMoviendo(null);
    if (!r.ok) toast({ title: "No cambió el orden", description: r.error, variant: "error" });
    router.refresh();
  }

  return (
    <ul aria-busy={moviendo !== null || guardando} className="divide-y divide-border border-y border-border">
      {enPantalla.map((p) => {
        const portada = p.imagenes[0];
        return (
          <li
            key={p.id}
            {...propsDeFila(p.id)}
            className={cn(
              "flex items-center gap-3 py-2",
              arrastrando === p.id && "opacity-50",
              encima === p.id && arrastrando && arrastrando !== p.id && "bg-accent-soft",
            )}
          >
            <span className="h-14 w-20 shrink-0 overflow-hidden rounded bg-canvas-sunken">
              {portada && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={miniaturaDesdeUrl(portada.url, 160) ?? portada.url} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <Link href={`/portafolio/${p.id}`} className="text-sm font-medium text-ink underline-offset-2 hover:underline">
                {p.titulo}
              </Link>
              <p className="text-xs text-ink-muted">
                {p.categoria}
                {p.cliente && ` · ${p.cliente}`}
                {` · ${p.imagenes.length} ${p.imagenes.length === 1 ? "foto" : "fotos"}`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-xs">
              <span className={p.publicado ? "text-success" : "text-ink-subtle"}>{p.publicado ? "Publicado" : "Borrador"}</span>
              {p.destacado && <span className="text-accent">Destacado</span>}
            </div>
            <div className="flex flex-col text-xs">
              <button type="button" onClick={() => mover(p.id, -1)} aria-label={`Subir ${p.titulo}`} className="rounded px-2 py-0.5 text-ink-muted hover:bg-canvas-sunken hover:text-ink">
                Subir
              </button>
              <button type="button" onClick={() => mover(p.id, 1)} aria-label={`Bajar ${p.titulo}`} className="rounded px-2 py-0.5 text-ink-muted hover:bg-canvas-sunken hover:text-ink">
                Bajar
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
