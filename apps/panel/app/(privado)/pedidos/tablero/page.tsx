import { tableroDePedidos } from "@jyl/core/server";
import type { Metadata } from "next";
import Link from "next/link";
import { AvisoPedidosNuevos } from "@/components/pedidos/AvisoPedidosNuevos";
import { TableroPedidos } from "@/components/pedidos/TableroPedidos";
import { paginaSoloPara } from "@/servidor/sesion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tablero de pedidos — Panel JYL" };

/** Kanban por estado — SPEC.md §6.3. Admin y operador. */
export default async function TableroDePedidos() {
  const sesion = await paginaSoloPara(["admin", "operador"]);
  const columnas = await tableroDePedidos();

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl text-ink">Tablero</h1>
        <Link href="/pedidos" className="text-sm text-accent underline-offset-2 hover:underline">
          Ver como lista
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-muted">
        Arrastra una tarjeta a otra columna, o usa el selector de cada tarjeta.
      </p>

      <div className="mt-4">
        <AvisoPedidosNuevos uid={sesion.uid} refrescarSola />
      </div>

      <div className="mt-4">
        <TableroPedidos columnas={columnas} />
      </div>
    </main>
  );
}
