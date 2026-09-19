import { z } from "zod";

/**
 * Facturación — SPEC.md §6.5 y §7. Lo que el panel puede escribir en una
 * factura. Número, totales, emisor e impuesto no aparecen en ningún esquema a
 * propósito: los pone el servidor al emitir (§7 principio 6).
 */

export const ESTADOS_FACTURA = ["borrador", "emitida", "pagada", "anulada"] as const;
export type EstadoFactura = (typeof ESTADOS_FACTURA)[number];

export const NOMBRE_ESTADO_FACTURA: Record<EstadoFactura, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  pagada: "Pagada",
  anulada: "Anulada",
};

export const METODOS_PAGO = ["efectivo", "transferencia", "nequi", "daviplata", "tarjeta", "otro"] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const NOMBRE_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  nequi: "Nequi",
  daviplata: "Daviplata",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

export const MAX_LINEAS_FACTURA = 50;

const pesos = (nombre: string) =>
  z
    .number({ invalid_type_error: `${nombre}: escribe un número.` })
    .int(`${nombre}: en pesos, sin decimales.`)
    .nonnegative(`${nombre} no puede ser negativo.`)
    .max(1_000_000_000, `${nombre}: el valor es demasiado alto.`);

const texto = (max: number) => z.string().trim().max(max).default("");

/** Un día del calendario, `2026-10-02`. */
const dia = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elige una fecha.");

export const lineaFacturaSchema = z
  .object({
    descripcion: z.string().trim().min(2, "Describe qué se cobra.").max(200),
    cantidad: z
      .number({ invalid_type_error: "Cantidad: escribe un número." })
      .int("La cantidad es un número entero.")
      .min(1, "La cantidad es al menos 1.")
      .max(100_000),
    precioUnitario: pesos("Precio"),
    /** En pesos, sobre el total de la línea (no por unidad). */
    descuento: pesos("Descuento").default(0),
    /** La variante vive dentro del producto: hacen falta los dos para encontrarla. */
    productId: z.string().min(1).nullable().default(null),
    variantId: z.string().min(1).nullable().default(null),
  })
  .refine((l) => l.descuento <= l.cantidad * l.precioUnitario, {
    message: "El descuento no puede ser mayor que la línea.",
    path: ["descuento"],
  })
  .refine((l) => (l.productId === null) === (l.variantId === null), {
    message: "La línea está vinculada a medias a un producto.",
    path: ["descripcion"],
  });

export type LineaFactura = z.output<typeof lineaFacturaSchema>;

export const clienteFacturaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe el nombre o la razón social.").max(120),
  /** Cédula o NIT. Opcional: muchas ventas son a personas que no lo piden. */
  documento: texto(30),
  email: z
    .string()
    .trim()
    .default("")
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Ese correo no tiene un formato válido.",
    }),
  telefono: texto(30),
  direccion: texto(160),
  ciudad: texto(80),
});

export type ClienteFactura = z.output<typeof clienteFacturaSchema>;

/** Lo que se edita mientras la factura es borrador. */
export const borradorFacturaSchema = z.object({
  orderId: z.string().min(1).nullable().default(null),
  clienteDatos: clienteFacturaSchema,
  lineas: z
    .array(lineaFacturaSchema)
    .min(1, "Agrega al menos una línea.")
    .max(MAX_LINEAS_FACTURA, `Hasta ${MAX_LINEAS_FACTURA} líneas por factura.`),
  vencimientoEn: dia.nullable().default(null),
});

export type BorradorFactura = z.output<typeof borradorFacturaSchema>;
export type BorradorFacturaEntrante = z.input<typeof borradorFacturaSchema>;

export const pagoSchema = z.object({
  fecha: dia,
  monto: pesos("Monto").min(1, "El monto tiene que ser mayor que cero."),
  metodo: z.enum(METODOS_PAGO, { errorMap: () => ({ message: "Elige cómo pagó." }) }),
});

export type Pago = z.output<typeof pagoSchema>;

/** SPEC.md §5.1: anular exige escribir el motivo. */
export const anulacionSchema = z.object({
  motivo: z.string().trim().min(3, "Explica en pocas palabras por qué se anula.").max(300),
});
