import { esPersonal } from "@jyl/core";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CambiosSinGuardarProvider } from "@/components/cambios/CambiosSinGuardar";
import { CerrarSesionPanel } from "@/components/CerrarSesionPanel";
import { Navegacion } from "@/components/navegacion/Navegacion";
import { SITIO_URL } from "@/lib/sitio";
import { sesionActual } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Guard del panel — SPEC.md §6: acceso solo con credenciales y rol
 * autorizado. Se resuelve en el servidor antes de renderizar, así que nunca
 * se llega a pintar el cascarón para luego echar a nadie.
 */
export default async function LayoutPrivado({ children }: { children: ReactNode }) {
  const sesion = await sesionActual();

  if (!sesion) redirect("/entrar");

  // Con sesión pero sin rol del estudio no se redirige a /entrar: eso daría un
  // bucle. Se dice lo que pasa y se ofrece salir.
  if (!esPersonal(sesion.rol)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-6">
        <h1 className="font-display text-2xl text-ink">Esta cuenta no tiene acceso</h1>
        <p className="mt-3 text-sm text-ink-muted">
          Entraste como {sesion.email}, pero esa cuenta no tiene un rol del
          estudio. Pídele a un administrador que te lo asigne.
        </p>
        <div className="mt-8">
          <CerrarSesionPanel />
        </div>
      </main>
    );
  }

  return (
    <CambiosSinGuardarProvider>
      <div className="min-h-screen">
        <Navegacion
          rol={sesion.rol}
          email={sesion.email}
          nombre={sesion.nombre}
          sitio={SITIO_URL}
        />
        <div className="lg:pl-56">{children}</div>
      </div>
    </CambiosSinGuardarProvider>
  );
}
