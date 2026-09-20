import "server-only";

import { Timestamp, type DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../firebase/admin";
import { estadoPedidoSchema, type EstadoPedido } from "../pedidos/esquemas";
import type { EstadoFactura } from "../facturas/esquemas";
import { ESTADOS_FACTURA } from "../facturas/esquemas";

/**
 * Lo que un cliente ve de lo suyo en «Mi cuenta» — SPEC.md §4.8.
 *
 * Es deliberadamente más pobre que la ficha del panel: aquí no salen las
 * notas internas del estudio ni el detalle de lo que se le cobró de más o de
 * menos. Todo lo que devuelve esta función viaja al navegador del cliente,
 * así que solo va lo que es suyo y puede ver.
 */

const db = () => getFirebaseAdmin().db;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const txt = (v: unknown) => (typeof v === "string" ? v : "");
const iso = (v: unknown) => (v instanceof Timestamp ? v.toDate().toISOString() : null);

export const PEDIDOS_EN_MI_CUENTA = 20;

export interface PedidoDeMiCuenta {
  id: string;
  numero: string;
  estado: EstadoPedido;
  servicio: string | null;
  creadoEn: string | null;
}

export interface FacturaDeMiCuenta {
  numero: string;
  estado: EstadoFactura;
  total: number;
  saldo: number;
  emitidaEn: string | null;
}

export interface HistorialDelCliente {
  pedidos: PedidoDeMiCuenta[];
  facturas: FacturaDeMiCuenta[];
}

export async function historialDelCliente(uid: string): Promise<HistorialDelCliente> {
  const [pedidos, facturas, servicios] = await Promise.all([
    db().collection("orders").where("uid", "==", uid).orderBy("createdAt", "desc").limit(PEDIDOS_EN_MI_CUENTA).get(),
    db().collection("invoices").where("clienteUid", "==", uid).get(),
    db().collection("services").select("nombre").get(),
  ]);

  const nombreDelServicio = new Map(servicios.docs.map((s) => [s.id, txt(s.data().nombre)]));

  return {
    pedidos: pedidos.docs.map((p): PedidoDeMiCuenta => {
      const d = p.data();
      const estado = estadoPedidoSchema.safeParse(d.estado);
      return {
        id: p.id,
        numero: txt(d.numero),
        estado: estado.success ? estado.data : "recibido",
        servicio: typeof d.serviceId === "string" ? (nombreDelServicio.get(d.serviceId) ?? null) : null,
        creadoEn: iso(d.createdAt),
      };
    }),
    // Un borrador todavía no existe para el cliente: no se le muestra.
    facturas: facturas.docs
      .flatMap((f): FacturaDeMiCuenta[] => {
        const d: DocumentData = f.data();
        const estado = (ESTADOS_FACTURA as readonly unknown[]).includes(d.estado) ? (d.estado as EstadoFactura) : "borrador";
        if (estado === "borrador") return [];
        return [
          {
            numero: txt(d.numero),
            estado,
            total: num(d.total),
            saldo: estado === "emitida" ? num(d.saldo) : 0,
            emitidaEn: iso(d.emitidaEn),
          },
        ];
      })
      .sort((a, b) => (b.emitidaEn ?? "").localeCompare(a.emitidaEn ?? "")),
  };
}
