"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ConfirmDialog } from "@jyl/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { IconoChevron, IconoPanel, IconoPincel, IconoRecibo, IconoSalir } from "@/components/iconos/Iconos";
import { cerrarSesion } from "@/lib/cerrar-sesion";

export interface IdentidadHeader {
  nombre: string | null;
  email: string | null;
  /**
   * Dirección del panel, solo si esta cuenta tiene rol del estudio. A un
   * cliente le llega null y ni siquiera ve la dirección: la comprobación la
   * hace el servidor al armar el layout, no el navegador.
   */
  panel: string | null;
}

/**
 * La cuenta en el header — SPEC.md §4.2.
 *
 * Sin sesión, *Entrar* es la única acción con color del header: es lo que se
 * quiere que haga quien llega. Antes era un enlace gris entre los demás y no
 * se veía.
 *
 * Con sesión, la inicial abre un menú. Antes el avatar llevaba directo a «Mi
 * cuenta» y no había forma de salir desde ninguna otra página: para cerrar
 * sesión había que adivinar que el botón estaba dentro de «Mi cuenta».
 */
export function AccountButton({ identidad }: { identidad: IdentidadHeader | null }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  if (!identidad) {
    return (
      <BotonAccion href="/entrar" variante="acento">
        Entrar
      </BotonAccion>
    );
  }

  const nombre = identidad.nombre?.trim() || identidad.email || "Mi cuenta";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <>
      {/*
        `modal={false}` arregla el salto del header. En modo modal, Radix
        bloquea el scroll del fondo, la barra desaparece y la página se
        ensancha 15 px de golpe: el header, que está fijo, se estiraba y la
        navegación saltaba a la derecha al abrir el menú.
        Un menú de cuenta en la barra superior no tiene por qué bloquear la
        página — Esc y el clic fuera lo siguen cerrando igual.
      */}
      <DropdownMenu.Root open={abierto} onOpenChange={setAbierto} modal={false}>
        <DropdownMenu.Trigger
          aria-label={`Cuenta de ${nombre}`}
          // Inicial en un círculo relleno y un chevrón que gira al abrir:
          // antes era un círculo con borde y nada decía que desplegaba un
          // menú. El relleno se invierte sobre el héroe, donde el texto del
          // header es claro.
          className="group/cuenta flex items-center gap-1 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
        >
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-medium text-ink-inverted transition-transform duration-200 ease-entrada group-hover/cuenta:scale-105 group-data-[state=open]/cuenta:scale-95 motion-reduce:transition-none group-[&:has([data-hero]):not([data-past-hero])]:bg-ink-inverted group-[&:has([data-hero]):not([data-past-hero])]:text-ink"
          >
            {inicial}
          </span>
          <IconoChevron className="h-4 w-4 transition-transform duration-200 ease-entrada group-data-[state=open]/cuenta:rotate-180 motion-reduce:transition-none" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={10}
            className="z-[70] w-60 overflow-hidden rounded-xl border border-border bg-canvas p-1.5 text-ink shadow-xl motion-safe:data-[state=open]:animate-content-in-menu motion-safe:data-[state=closed]:animate-content-out-menu"
          >
            {/* Quién es: en un menú de cuenta, lo primero es confirmar con
                qué cuenta estás dentro. */}
            <DropdownMenu.Label className="px-3 py-2">
              <span className="block truncate text-sm font-medium">{nombre}</span>
              {identidad.email && identidad.email !== nombre && (
                <span className="block truncate text-xs text-ink-muted">{identidad.email}</span>
              )}
            </DropdownMenu.Label>

            <DropdownMenu.Separator className="my-1 h-px bg-border" />

            {/* Primero y destacado: quien administra entra al panel muchas
                más veces de las que mira sus propias facturas. Sale de la
                aplicación, así que es un <a> normal y no un Link de Next. */}
            {identidad.panel && (
              <DropdownMenu.Item asChild>
                <a
                  href={identidad.panel}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-accent outline-none data-[highlighted]:bg-accent-soft"
                >
                  <IconoPanel className="h-4 w-4" />
                  Ir al panel del estudio
                </a>
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Item asChild>
              <Link
                href="/mi-cuenta"
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-canvas-sunken"
              >
                <IconoRecibo className="h-4 w-4 text-ink-muted" />
                Mis pedidos y facturas
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <Link
                href="/pedido"
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-canvas-sunken"
              >
                <IconoPincel className="h-4 w-4 text-ink-muted" />
                Pedir un trabajo
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="my-1 h-px bg-border" />

            <DropdownMenu.Item
              onSelect={(evento) => {
                // Se cierra el menú a mano y después se abre el diálogo: si se
                // dejan solos, el foco que Radix devuelve al botón pelea con
                // el que reclama el modal.
                evento.preventDefault();
                setAbierto(false);
                setConfirmar(true);
              }}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger outline-none data-[highlighted]:bg-danger-soft"
            >
              <IconoSalir className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmDialog
        open={confirmar}
        onOpenChange={setConfirmar}
        title="¿Cerrar la sesión?"
        description="Tendrás que volver a entrar para ver tus pedidos y tus facturas."
        confirmLabel="Cerrar sesión"
        onConfirm={async () => {
          await cerrarSesion();
          router.push("/");
          router.refresh();
        }}
      />
    </>
  );
}
