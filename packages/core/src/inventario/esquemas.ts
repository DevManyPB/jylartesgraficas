import { z } from "zod";
import { TIPOS_MOVIMIENTO } from "./stock";

/**
 * Inventario — SPEC.md §6.4 y §7. Lo que el panel puede escribir. El stock
 * no aparece en ningún esquema de edición a propósito: solo cambia por un
 * movimiento, que lo recalcula el servidor en transacción.
 */

const pesosEnteros = (nombre: string) =>
  z
    .number({ invalid_type_error: `${nombre}: escribe un número.` })
    .int(`${nombre}: en pesos, sin decimales.`)
    .nonnegative(`${nombre} no puede ser negativo.`);

const texto = (max: number) => z.string().trim().max(max).default("");

export const MAX_IMAGENES_PRODUCTO = 8;

export const imagenEntranteSchema = z.object({
  publicId: z.string().min(1),
  /** Texto alternativo — SPEC.md §9: obligatorio en todas las imágenes. */
  alt: z.string().trim().min(3, "Describe la imagen en pocas palabras.").max(160),
});

export const productoEditableSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre necesita al menos 3 letras.").max(80),
  categoria: z.string().trim().min(2, "Escribe la categoría, p. ej. Camisetas.").max(40),
  descripcion: texto(1200),
  proveedor: texto(80),
  permitePersonalizacion: z.boolean().default(false),
  activo: z.boolean().default(false),
  imagenes: z
    .array(imagenEntranteSchema)
    .max(MAX_IMAGENES_PRODUCTO, `Hasta ${MAX_IMAGENES_PRODUCTO} imágenes por producto.`)
    .default([]),
});

export type ProductoEditable = z.output<typeof productoEditableSchema>;

export const varianteEditableSchema = z
  .object({
    talla: texto(20),
    color: texto(30),
    sku: texto(40),
    stockMinimo: z.number().int().nonnegative("El mínimo no puede ser negativo.").default(0),
    /** Lo que cuesta al estudio. Solo lo ve el admin (SPEC.md §6.1). */
    costoUnitario: pesosEnteros("El costo").nullable().default(null),
    precioVenta: pesosEnteros("El precio"),
    activo: z.boolean().default(true),
  })
  // Una variante sin talla ni color no se distingue de otra en la tienda.
  .refine((v) => v.talla !== "" || v.color !== "", {
    message: "Pon al menos una talla o un color.",
    path: ["talla"],
  });

export type VarianteEditable = z.output<typeof varianteEditableSchema>;

/** Al crear, además, cuántas hay: entra al historial como primera entrada. */
export const varianteNuevaSchema = z.intersection(
  varianteEditableSchema,
  z.object({ stockInicial: z.number().int().nonnegative().default(0) }),
);

export const movimientoSchema = z.object({
  tipo: z.enum(TIPOS_MOVIMIENTO, { errorMap: () => ({ message: "Elige el tipo de movimiento." }) }),
  cantidad: z
    .number({ invalid_type_error: "Escribe la cantidad." })
    .int("La cantidad va en unidades enteras.")
    .nonnegative("La cantidad no puede ser negativa."),
  /** SPEC.md §6.4: cada movimiento guarda por qué. */
  motivo: z.string().trim().min(3, "Cuenta brevemente el motivo.").max(200),
});

export type Movimiento = z.output<typeof movimientoSchema>;

export const insumoEditableSchema = z.object({
  nombre: z.string().trim().min(3, "El nombre necesita al menos 3 letras.").max(80),
  sku: texto(40),
  /** "hojas", "ml", "metros"… en lo que se cuenta. */
  unidad: z.string().trim().min(1, "¿En qué se cuenta? Unidades, hojas, metros…").max(20),
  stockMinimo: z.number().int().nonnegative().default(0),
  costoUnitario: pesosEnteros("El costo").nullable().default(null),
  proveedor: texto(80),
});

export type InsumoEditable = z.output<typeof insumoEditableSchema>;
