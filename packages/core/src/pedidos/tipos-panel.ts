import type { EstadoPedido } from "./esquemas";

/**
 * Formas en que el panel recibe los pedidos. Las fechas llegan como texto
 * ISO: un `Timestamp` de Firestore no cruza de un Server Component a uno de
 * cliente.
 */

export interface ContactoDelPedido {
  nombre: string;
  email: string;
  telefono: string;
  ciudad: string;
  /** true si es un cliente con cuenta; false si pidió como invitado. */
  conCuenta: boolean;
}

export interface FilaPedido {
  id: string;
  numero: string;
  estado: EstadoPedido;
  creadoEn: string | null;
  servicio: string | null;
  contacto: ContactoDelPedido;
  archivos: number;
  archivosIncompletos: boolean;
}

export interface ArchivoDelPedido {
  publicId: string;
  url: string;
  formato: string;
  bytes: number;
  ancho: number | null;
  alto: number | null;
}

export interface EventoDelPedido {
  id: string;
  tipo: string;
  estadoAnterior: EstadoPedido | null;
  estadoNuevo: EstadoPedido | null;
  mensaje: string;
  autor: string | null;
  creadoEn: string | null;
}

export interface PedidoDelPanel extends FilaPedido {
  tipo: "servicio" | "producto";
  detalle: string;
  medidas: string | null;
  material: string | null;
  camposExtra: Record<string, string>;
  fechaDeseada: string | null;
  presupuestoAprox: number | null;
  archivosDetalle: ArchivoDelPedido[];
  notasInternas: string;
  eventos: EventoDelPedido[];
}

export interface PaginaDePedidos {
  filas: FilaPedido[];
  /** Id del último de la página, para pedir la siguiente; null si no hay más. */
  siguiente: string | null;
}
