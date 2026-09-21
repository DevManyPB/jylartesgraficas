"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ConfirmDialog } from "@jyl/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BotonAccion } from "@/components/animacion/BotonAccion";
import { IconoFlecha, IconoRecibo, IconoSalir } from "@/components/iconos/Iconos";
import { cerrarSesion } from "@/lib/cerrar-sesion";

export interface IdentidadHeader {
  nombre: string | null;
  email: string | null;
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
          // El header cambia de color sobre el héroe, así que el estado se
          // marca con opacidad y no con un fondo, que solo se vería en uno.
          className="flex h-10 w-10 items-center justify-center rounded-full border border-current text-sm font-medium transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current data-[state=open]:opacity-70"
        >
          <span aria-hidden>{inicial}</span>
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
                <IconoFlecha className="h-4 w-4 text-ink-muted" />
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
