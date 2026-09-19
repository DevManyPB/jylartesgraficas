import { z } from "zod";
import { MAX_ARCHIVOS_POR_PEDIDO } from "../cloudinary/limites";

/** Estados visibles para el cliente — SPEC.md §4.8. */
export const ESTADOS_PEDIDO = [
  "recibido",
  "en_revision",
  "cotizado",
  "aprobado",
  "en_produccion",
  "listo",
  "entregado",
] as const;

export const estadoPedidoSchema = z.enum(ESTADOS_PEDIDO);
export type EstadoPedido = z.infer<typeof estadoPedidoSchema>;

/** Datos de quien pide sin cuenta — SPEC.md §7. */
export const invitadoSchema = z.object({
  nombre: z.string().trim().min(2, "Necesitamos tu nombre para responderte."),
  email: z.string().trim().email("Ese correo no tiene un formato válido."),
  telefono: z.string().trim().min(7, "Necesitamos un teléfono de contacto."),
  ciudad: z.string().trim().min(2, "Dinos en qué ciudad estás."),
});

export type Invitado = z.infer<typeof invitadoSchema>;

export const itemPedidoSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  nombre: z.string().min(1),
  talla: z.string().nullable().default(null),
  color: z.string().nullable().default(null),
  cantidad: z.number().int().positive(),
  personalizado: z.boolean().default(false),
});

/**
 * Lo único que el servidor acepta del navegador.
 *
 * No aparecen aquí a propósito: `numero`, `estado`, `uid`, `createdAt` ni
 * `archivos` ya resueltos. Todo eso lo pone el servidor — SPEC.md §7
 * principio 6: nunca se confía en el número que llega del cliente.
 */
export const pedidoEntranteSchema = z
  .object({
    tipo: z.enum(["servicio", "producto"]),
    serviceId: z.string().min(1).nullable().default(null),
    items: z.array(itemPedidoSchema).max(20).default([]),

    detalle: z.string().trim().min(10, "Cuéntanos un poco más sobre lo que necesitas.").max(5000),
    medidas: z.string().trim().max(200).nullable().default(null),
    material: z.string().trim().max(200).nullable().default(null),

    /**
     * Respuestas a las preguntas propias de cada servicio — marca del equipo,
     * sistema operativo… (SPEC.md §4.5). Es la contraparte del `campos[]` que
     * el servicio declara en §7.
     */
    camposExtra: z.record(z.string(), z.string().trim().max(500)).default({}),
    fechaDeseada: z.string().date().nullable().default(null),
    presupuestoAprox: z.number().nonnegative().nullable().default(null),

    /** Identificadores de Cloudinary; el servidor verifica cada uno. */
    archivos: z
      .array(z.string().min(1))
      .max(
        MAX_ARCHIVOS_POR_PEDIDO,
        `Puedes adjuntar hasta ${MAX_ARCHIVOS_POR_PEDIDO} archivos.`,
      )
      .default([]),

    /** Solo si no hay sesión: se ignora si la cookie identifica a alguien. */
    invitado: invitadoSchema.nullable().default(null),

    aceptaTerminos: z
      .boolean()
      .refine((v) => v, "Para continuar tienes que aceptar los términos."),
  })
  .refine((datos) => datos.tipo !== "servicio" || datos.serviceId !== null, {
    message: "Elige el servicio que necesitas.",
    path: ["serviceId"],
  })
  .refine((datos) => datos.tipo !== "producto" || datos.items.length > 0, {
    message: "Elige al menos un producto.",
    path: ["items"],
  });

export type PedidoEntrante = z.infer<typeof pedidoEntranteSchema>;

/** Cómo se nombra cada estado en pantalla. */
export const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  recibido: "Recibido",
  en_revision: "En revisión",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  en_produccion: "En producción",
  listo: "Listo",
  entregado: "Entregado",
};

/**
 * Cambio de estado desde el panel. Se permite ir a cualquier estado, también
 * hacia atrás: un pedido aprobado puede volver a revisión si el cliente pide
 * cambios. Lo que no se pierde es el rastro, porque cada cambio deja su
 * evento en el historial.
 */
export const cambioEstadoSchema = z.object({
  estado: estadoPedidoSchema,
  nota: z.string().trim().max(500, "La nota admite hasta 500 caracteres.").default(""),
});

export type CambioEstado = z.infer<typeof cambioEstadoSchema>;

export const notasInternasSchema = z.object({
  notasInternas: z.string().max(5000, "Las notas admiten hasta 5.000 caracteres."),
});

/**
 * Nombre visible de cada pregunta propia de un servicio (`camposExtra`), el
 * mismo que muestra el formulario de pedido (apps/web, PasoDetalles).
 */
export const NOMBRE_CAMPO_EXTRA: Record<string, string> = {
  equipo: "Marca del equipo",
  sistemaOperativo: "Sistema operativo",
};
