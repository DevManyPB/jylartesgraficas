import { buscarClientes, listarClientes } from "@jyl/core/server";
import { cn } from "@jyl/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { claseEntrada } from "@/components/formularios/Campo";
import { formatearFechaCorta } from "@/components/pedidos/formato";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Clientes — Panel JYL" };

const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

/**
 * Clientes — SPEC.md §6.6. Solo admin: la ficha muestra lo facturado, que es
 * finanzas (§6.1). Aquí están quienes tienen cuenta; a los invitados se les
 * encuentra desde Pedidos, que es donde quedaron sus datos.
 */
export default async function Clientes({ searchParams }: PageProps<"/clientes">) {
  await paginaSoloPara(["admin"]);
  const parametros = await searchParams;
  const busqueda = uno(parametros.q)?.trim() ?? "";
  const desde = uno(parametros.desde);

  const pagina = busqueda
    ? { filas: await buscarClientes(busqueda), siguiente: null }
    : await listarClientes(desde);

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Clientes</h1>
        <form action="/clientes" role="search" className="flex items-center gap-2">
          <label htmlFor="buscar-cliente" className="sr-only">
            Buscar por nombre o correo
          </label>
          <input
            id="buscar-cliente"
            name="q"
            defaultValue={busqueda}
            placeholder="Nombre o correo"
            inputMode="search"
            autoComplete="off"
            className={cn(claseEntrada, "w-44")}
          />
          <button
            type="submit"
            className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-ink transition-colors hover:bg-canvas-sunken"
          >
            Buscar
          </button>
        </form>
      </div>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">
        Los que tienen cuenta. Quien pidió como invitado aparece en su pedido, no aquí.
      </p>

      <div className="mt-4">
        {busqueda && (
          <p className="mb-3 text-sm text-ink-muted">
            {pagina.filas.length === 0
              ? `Ningún cliente coincide con "${busqueda}".`
              : `${pagina.filas.length === 1 ? "1 cliente" : `${pagina.filas.length} clientes`} para "${busqueda}".`}{" "}
            <Link href="/clientes" className="text-accent underline-offset-2 hover:underline">
              Ver todos
            </Link>
          </p>
        )}

        {pagina.filas.length > 0 ? (
          <div className="border-y border-border">
            <table className="w-full text-sm">
              <thead className="sr-only md:not-sr-only">
                <tr className="text-left text-xs text-ink-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Cliente</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Contacto</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Ciudad</th>
                  <th scope="col" className="py-2 font-medium">Cuenta creada</th>
                </tr>
              </thead>
              <tbody>
                {pagina.filas.map((cliente) => (
                  <tr key={cliente.uid} className="border-t border-border">
                    <td className="py-2.5 pr-4">
                      <Link
                        href={`/clientes/${cliente.uid}`}
                        className="font-medium text-ink underline-offset-2 hover:underline"
                      >
                        {cliente.nombre || "Sin nombre"}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-ink-muted">
                      <span className="block break-all">{cliente.email}</span>
                      {cliente.telefono && <span className="block tabular-nums">{cliente.telefono}</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-ink-muted">{cliente.ciudad || "—"}</td>
                    <td className="py-2.5 text-ink-muted">{formatearFechaCorta(cliente.creadoEn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !busqueda && (
            <p className="border-y border-border py-8 text-center text-sm text-ink-muted">
              Todavía nadie ha creado una cuenta.
            </p>
          )
        )}

        <div className="mt-4 flex gap-4 text-sm">
          {desde && (
            <Link href="/clientes" className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
              Volver al principio
            </Link>
          )}
          {pagina.siguiente && (
            <Link href={`/clientes?desde=${pagina.siguiente}`} className="text-accent underline-offset-2 hover:underline">
              Ver más clientes
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
