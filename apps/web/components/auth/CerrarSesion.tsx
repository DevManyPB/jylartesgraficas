"use client";

import { getFirebase } from "@jyl/core";
import { ConfirmDialog } from "@jyl/ui";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** SPEC.md §5.1: cerrar sesión lleva confirmación simple, no un alert. */
export function CerrarSesion() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas-sunken"
      >
        Cerrar sesión
      </button>

      <ConfirmDialog
        open={abierto}
        onOpenChange={setAbierto}
        title="¿Cerrar la sesión?"
        description="Tendrás que volver a entrar para ver tus pedidos y facturas."
        confirmLabel="Cerrar sesión"
        onConfirm={async () => {
          const { auth } = getFirebase();
          await signOut(auth);
          await fetch("/api/session", { method: "DELETE" });
          router.push("/");
          router.refresh();
        }}
      />
    </>
  );
}
