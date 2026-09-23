"use client";

import { DIAS_SEMANA, type DiaSemana, type Horario, NOMBRE_DIA } from "@jyl/core";
import { useEffect, useState } from "react";
import { formatearHora } from "@/lib/formato";

/**
 * "Abierto ahora" o "Cerrado" — SPEC.md §4.6, calculado en el cliente.
 *
 * La hora que importa es la del estudio, no la del visitante: alguien que
 * abra la página desde otro país tiene que ver si aquí están abiertos. Por
 * eso el día y la hora se leen con la zona de Colombia, no con el reloj del
 * navegador tal cual.
 *
 * Se calcula después de montar y no durante el render del servidor: el
 * resultado depende del momento exacto, y pintarlo en el servidor lo dejaría
 * congelado en la caché de la página — además de romper la hidratación.
 */

const ZONA = "America/Bogota";

/** Los días que devuelve Intl, en el orden en que los guarda el panel. */
const DIA_DESDE_INTL: Record<string, DiaSemana> = {
  Monday: "lunes",
  Tuesday: "martes",
  Wednesday: "miercoles",
  Thursday: "jueves",
  Friday: "viernes",
  Saturday: "sabado",
  Sunday: "domingo",
};

/** Minutos desde medianoche de una hora "08:30"; null si no es una hora. */
function enMinutos(hora: string): number | null {
  const partes = /^(\d{1,2}):(\d{2})$/.exec(hora);
  if (!partes) return null;
  return Number(partes[1]) * 60 + Number(partes[2]);
}

interface Estado {
  abierto: boolean;
  detalle: string;
}

/** El día y los minutos desde medianoche en Bogotá, o null si Intl falla. */
export function ahoraEnBogota(ahora: Date): { dia: DiaSemana; minutos: number } | null {
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const partes = formato.formatToParts(ahora);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find((p) => p.type === tipo)?.value ?? "";

  const dia = DIA_DESDE_INTL[valor("weekday")];
  if (!dia) return null;
  // Intl escribe la medianoche como "24" en algunas versiones de ICU.
  return { dia, minutos: (Number(valor("hour")) % 24) * 60 + Number(valor("minute")) };
}

function calcular(horarios: Horario[], ahora: Date): Estado | null {
  const momento = ahoraEnBogota(ahora);
  if (!momento) return null;
  const { dia, minutos } = momento;

  const hoy = horarios.find((h) => h.dia === dia);
  if (hoy && !hoy.cerrado) {
    const abre = enMinutos(hoy.abre);
    const cierra = enMinutos(hoy.cierra);
    if (abre !== null && cierra !== null && minutos >= abre && minutos < cierra) {
      return { abierto: true, detalle: `Cierra a las ${formatearHora(hoy.cierra)}` };
    }
    if (abre !== null && minutos < abre) {
      return { abierto: false, detalle: `Abre hoy a las ${formatearHora(hoy.abre)}` };
    }
  }

  // Cerrado: el siguiente día con horario, buscando desde mañana.
  const desde = DIAS_SEMANA.indexOf(dia);
  for (let salto = 1; salto <= DIAS_SEMANA.length; salto += 1) {
    const siguiente = DIAS_SEMANA[(desde + salto) % DIAS_SEMANA.length]!;
    const horario = horarios.find((h) => h.dia === siguiente);
    if (!horario || horario.cerrado || enMinutos(horario.abre) === null) continue;
    const cuando = salto === 1 ? "mañana" : `el ${NOMBRE_DIA[siguiente].toLowerCase()}`;
    return { abierto: false, detalle: `Abre ${cuando} a las ${formatearHora(horario.abre)}` };
  }

  // Ningún día tiene horario: no hay nada honesto que decir.
  return null;
}

export function EstadoAhora({ horarios }: { horarios: Horario[] }) {
  const [estado, setEstado] = useState<Estado | null>(null);

  useEffect(() => {
    const refrescar = () => setEstado(calcular(horarios, new Date()));
    refrescar();
    // Si alguien deja la pestaña abierta, que no siga diciendo "abierto"
    // media hora después de haber cerrado.
    const reloj = window.setInterval(refrescar, 60_000);
    return () => window.clearInterval(reloj);
  }, [horarios]);

  if (!estado) return null;

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      <span className="inline-flex items-center gap-2 font-medium text-ink">
        <span
          aria-hidden
          className={
            estado.abierto
              ? "h-2 w-2 rounded-full bg-success"
              : "h-2 w-2 rounded-full bg-border-strong"
          }
        />
        {estado.abierto ? "Abierto ahora" : "Cerrado ahora"}
      </span>
      <span className="text-ink-muted">{estado.detalle}</span>
    </p>
  );
}
