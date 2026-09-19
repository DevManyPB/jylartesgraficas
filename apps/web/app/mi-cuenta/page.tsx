import { COOKIE_SESION, leerSesion } from "@jyl/core/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CerrarSesion } from "@/components/auth/CerrarSesion";

export const runtime = "nodejs";
// La sesión se resuelve por petición: no tiene sentido prerenderizarla.
export const dynamic = "force-dynamic";

export default async function MiCuenta() {
  const sesion = await leerSesion((await cookies()).get(COOKIE_SESION)?.value);
  if (!sesion) redirect("/entrar");

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink">Mi cuenta</h1>
      <p className="mt-4 text-base text-ink-muted">
        {sesion.nombre ?? sesion.email}
      </p>

      <div className="mt-10 rounded-xl border border-border p-6">
        <h2 className="font-display text-xl text-ink">Tus pedidos</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Aún no tienes pedidos. Cuando envíes el primero aparecerá aquí con su
          estado.
        </p>
      </div>

      <div className="mt-8">
        <CerrarSesion />
      </div>
    </main>
  );
}
