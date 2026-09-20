import { NOMBRE_ESTADO, NOMBRE_ESTADO_FACTURA } from "@jyl/core";
import { COOKIE_SESION, historialDelCliente, leerContactoCliente, leerSesion } from "@jyl/core/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CerrarSesion } from "@/components/auth/CerrarSesion";
import { formatearFecha, pesos } from "@/lib/formato";

export const runtime = "nodejs";
// La sesión se resuelve por petición: no tiene sentido prerenderizarla.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi cuenta",
  robots: { index: false },
};

/** Mi cuenta — SPEC.md §4.8: el historial, el estado de cada pedido y las facturas. */
export default async function MiCuenta() {
  const sesion = await leerSesion((await cookies()).get(COOKIE_SESION)?.value);
  if (!sesion) redirect("/entrar");

  const [historial, contacto] = await Promise.all([
    historialDelCliente(sesion.uid),
    leerContactoCliente(sesion.uid),
  ]);

  return (
    <main className="mx-auto w-full max-w-content px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <h1 className="font-display text-4xl text-ink">Mi cuenta</h1>
      <p className="mt-2 text-base text-ink-muted">{contacto.nombre || sesion.nombre || sesion.email}</p>

      <section aria-labelledby="mis-pedidos" className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="mis-pedidos" className="font-display text-xl text-ink">
            Tus pedidos
          </h2>
          <Link href="/pedido" className="text-sm font-medium text-accent underline-offset-4 hover:underline">
            Pedir otro trabajo
          </Link>
        </div>

        {historial.pedidos.length > 0 ? (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {historial.pedidos.map((pedido) => (
              <li key={pedido.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <span className="min-w-0">
                  <span className="block font-medium tabular-nums text-ink">{pedido.numero}</span>
                  <span className="text-sm text-ink-muted">
                    {pedido.servicio ?? "Productos de la tienda"} · {formatearFecha(pedido.creadoEn)}
                  </span>
                </span>
                <span className="rounded-full bg-canvas-sunken px-3 py-1 text-sm text-ink">
                  {NOMBRE_ESTADO[pedido.estado]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl border border-border bg-canvas-sunken p-6 text-sm text-ink-muted">
            Aún no tienes pedidos. Cuando envíes el primero aparecerá aquí con su estado.
          </p>
        )}
      </section>

      {historial.facturas.length > 0 && (
        <section aria-labelledby="mis-facturas" className="mt-12">
          <h2 id="mis-facturas" className="font-display text-xl text-ink">
            Tus facturas
          </h2>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {historial.facturas.map((factura) => (
              <li key={factura.numero} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                <span>
                  <span className="block font-medium tabular-nums text-ink">{factura.numero}</span>
                  <span className="text-sm text-ink-muted">{formatearFecha(factura.emitidaEn)}</span>
                </span>
                <span className="flex flex-wrap items-baseline gap-3 text-sm">
                  <span className="tabular-nums text-ink">{pesos.format(factura.total)}</span>
                  {factura.saldo > 0 && (
                    <span className="tabular-nums text-ink-muted">faltan {pesos.format(factura.saldo)}</span>
                  )}
                  <span className="rounded-full bg-canvas-sunken px-3 py-1 text-ink">
                    {NOMBRE_ESTADO_FACTURA[factura.estado]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-subtle">
            ¿Necesitas una factura en PDF? Escríbenos y te la enviamos.
          </p>
        </section>
      )}

      <div className="mt-12">
        <CerrarSesion />
      </div>
    </main>
  );
}
