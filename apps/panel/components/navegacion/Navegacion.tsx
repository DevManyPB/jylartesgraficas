"use client";

import type { Rol } from "@jyl/core";
import { cn } from "@jyl/ui";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { EnlaceProtegido } from "@/components/cambios/CambiosSinGuardar";
import { CerrarSesionPanel } from "@/components/CerrarSesionPanel";
import { estaActiva, seccionesPara } from "./secciones";

interface NavegacionProps {
  rol: Rol;
  email: string | null;
  nombre: string | null;
}

const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  operador: "Operador",
  cliente: "Cliente",
};

/**
 * Navegación del panel — SPEC.md §9: densidad sobre aire decorativo.
 *
 * En escritorio es una columna fija. En móvil se pliega detrás de un botón
 * "Menú" que la despliega debajo de la barra: es un disclosure, no un modal,
 * porque no pide ninguna decisión y el panel no gana nada tapando la página.
 */
export function Navegacion({ rol, email, nombre }: NavegacionProps) {
  const ruta = usePathname();
  const [abierta, setAbierta] = useState(false);
  const idLista = useId();
  const secciones = seccionesPara(rol);

  return (
    <aside className="border-b border-border bg-canvas-sunken lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex h-14 items-center justify-between px-4 lg:h-16 lg:px-5">
        <EnlaceProtegido href="/" className="rounded-sm leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
          <span className="block font-display text-lg font-bold text-ink">JYL</span>
          <span className="block text-[11px] text-ink-muted">panel del estudio</span>
        </EnlaceProtegido>

        <button
          type="button"
          onClick={() => setAbierta((valor) => !valor)}
          aria-expanded={abierta}
          aria-controls={idLista}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-border lg:hidden"
        >
          {abierta ? "Cerrar" : "Menú"}
        </button>
      </div>

      <div
        id={idLista}
        className={cn("flex-1 flex-col px-2 pb-4 lg:flex lg:px-3", abierta ? "flex" : "hidden")}
      >
        <nav aria-label="Secciones del panel">
          <ul className="flex flex-col gap-0.5">
            {secciones.map((seccion) => {
              const activa = estaActiva(seccion, ruta);
              return (
                <li key={seccion.href}>
                  <EnlaceProtegido
                    href={seccion.href}
                    onClick={() => setAbierta(false)}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "flex items-center rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
                      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                      activa
                        ? "border-accent bg-canvas font-medium text-ink"
                        : "border-transparent text-ink-muted hover:bg-border/60 hover:text-ink",
                    )}
                  >
                    {seccion.nombre}
                  </EnlaceProtegido>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-6 border-t border-border px-3 pt-4 lg:mt-auto">
          <p className="truncate text-sm font-medium text-ink">{nombre ?? email}</p>
          {nombre && email && <p className="truncate text-xs text-ink-muted">{email}</p>}
          <p className="mt-0.5 text-xs text-ink-subtle">{NOMBRE_ROL[rol]}</p>
          <div className="mt-3">
            <CerrarSesionPanel />
          </div>
        </div>
      </div>
    </aside>
  );
}
