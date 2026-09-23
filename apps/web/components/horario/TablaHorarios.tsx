"use client";

import { DIAS_SEMANA, type DiaSemana, type Horario, NOMBRE_DIA } from "@jyl/core";
import { cn } from "@jyl/ui";
import { useEffect, useState } from "react";
import { franjaDelDia } from "@/lib/formato";
import { ahoraEnBogota } from "./EstadoAhora";

/**
 * La semana de horarios, con el día de hoy marcado — SPEC.md §4.6.
 *
 * Quien abre esta tabla casi siempre quiere saber una cosa: a qué hora
 * atienden hoy. Así no tiene que buscar su día entre siete filas.
 *
 * «Hoy» es el de Bogotá, no el del navegador, y se marca después de montar,
 * igual que `EstadoAhora`: calculado en el servidor quedaría congelado en la
 * caché de la página. Antes de montar, la tabla sale igual pero sin marca.
 */
export function TablaHorarios({ horarios }: { horarios: Horario[] }) {
  const [hoy, setHoy] = useState<DiaSemana | null>(null);

  useEffect(() => {
    const refrescar = () => setHoy(ahoraEnBogota(new Date())?.dia ?? null);
    refrescar();
    const reloj = window.setInterval(refrescar, 60_000);
    return () => window.clearInterval(reloj);
  }, []);

  return (
    <dl className="flex flex-col text-sm">
      {DIAS_SEMANA.map((dia) => {
        const horario = horarios.find((h) => h.dia === dia);
        const franja = horario ? franjaDelDia(horario) : null;
        const esHoy = dia === hoy;
        return (
          <div
            key={dia}
            className={cn(
              "relative flex justify-between gap-4 border-b border-border py-2 pl-3 last:border-0",
              esHoy && "bg-canvas-sunken font-medium",
            )}
          >
            {/* La marca de hoy: una barra magenta a la izquierda, además del
                fondo y la palabra «hoy» — no solo el color (AGENTS.md §11). */}
            {esHoy && <span aria-hidden className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-accent" />}
            <dt className={esHoy ? "text-ink" : "text-ink-muted"}>
              {NOMBRE_DIA[dia]}
              {esHoy && <span className="ml-2 text-xs font-normal text-ink-muted">hoy</span>}
            </dt>
            <dd className="pr-2 tabular-nums text-ink">{franja ?? "—"}</dd>
          </div>
        );
      })}
    </dl>
  );
}
