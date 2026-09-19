import type { TipoMovimiento } from "./stock";

import type { ImagenGuardada } from "../catalogo/tipos";

export type { ImagenGuardada };

export interface VarianteDelPanel {
  id: string;
  talla: string;
  color: string;
  sku: string;
  stock: number;
  stockMinimo: number;
  costoUnitario: number | null;
  precioVenta: number;
  activo: boolean;
}

export interface ProductoDelPanel {
  id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  proveedor: string;
  permitePersonalizacion: boolean;
  activo: boolean;
  orden: number;
  imagenes: ImagenGuardada[];
  /** Agregados que mantiene el servidor con cada movimiento. */
  stockTotal: number;
  precioDesde: number | null;
  precioHasta: number | null;
  variantesBajoMinimo: number;
}

export interface ProductoConVariantes extends ProductoDelPanel {
  variantes: VarianteDelPanel[];
}

export interface MovimientoDelPanel {
  id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  delta: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo: string;
  /** "Negra / M" o el nombre del insumo: qué se movió. */
  de: string;
  autor: string | null;
  orderId: string | null;
  creadoEn: string | null;
}

export interface InsumoDelPanel {
  id: string;
  nombre: string;
  sku: string;
  unidad: string;
  stock: number;
  stockMinimo: number;
  costoUnitario: number | null;
  proveedor: string;
}

/** Cómo se nombra una variante: "Negra / M", "M" o "Negra". */
export function nombreDeVariante(v: { talla: string; color: string }): string {
  return [v.color, v.talla].filter(Boolean).join(" / ");
}
