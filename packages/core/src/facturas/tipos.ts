import type { ClienteFactura, EstadoFactura, LineaFactura, MetodoPago } from "./esquemas";

/**
 * Formas en que el panel recibe las facturas. Las fechas llegan como texto
 * ISO: un `Timestamp` no cruza de un Server Component a uno de cliente.
 */

/** Copia del emisor al emitir: una factura vieja no cambia si cambia la configuración. */
export interface EmisorFactura {
  razonSocial: string;
  nit: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface PagoDeFactura {
  fecha: string;
  monto: number;
  metodo: MetodoPago;
  registradoPor: string | null;
}

export interface FilaFactura {
  id: string;
  /** Null mientras es borrador: el número se asigna al emitir. */
  numero: string | null;
  estado: EstadoFactura;
  cliente: string;
  total: number;
  saldo: number;
  creadaEn: string | null;
  emitidaEn: string | null;
}

export interface FacturaDelPanel extends FilaFactura {
  orderId: string | null;
  /** Número del pedido de origen, para mostrarlo; null si no viene de un pedido. */
  pedidoNumero: string | null;
  clienteUid: string | null;
  clienteDatos: ClienteFactura;
  lineas: LineaFactura[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  /** El de la configuración al emitir; en un borrador, el vigente. */
  impuestoPorcentaje: number | null;
  emisor: EmisorFactura | null;
  vencimientoEn: string | null;
  pagos: PagoDeFactura[];
  anulacion: { motivo: string; autor: string | null; fecha: string | null } | null;
  stockDescontado: boolean;
}
