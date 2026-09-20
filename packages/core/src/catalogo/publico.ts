// Sin `server-only`: son los tipos de lo que el sitio público muestra, y las
// páginas de la tienda y el portafolio los usan también en el navegador. La
// lectura de Firestore vive en `publico-servidor.ts`.

import type { ImagenGuardada } from "./tipos";

/** Una variante tal como la ve el público: sin costo unitario, que es finanzas. */
export interface VariantePublica {
  id: string;
  talla: string;
  color: string;
  sku: string;
  precioVenta: number;
  /** Se muestra agotada, no se esconde — SPEC.md §6.4. */
  stock: number;
}

export interface ProductoPublico {
  slug: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  imagenes: ImagenGuardada[];
  permitePersonalizacion: boolean;
  precioDesde: number | null;
  precioHasta: number | null;
  stockTotal: number;
}

export interface ProductoPublicoConVariantes extends ProductoPublico {
  variantes: VariantePublica[];
}

export interface ProyectoPublico {
  slug: string;
  titulo: string;
  categoria: string;
  cliente: string;
  descripcion: string;
  imagenes: ImagenGuardada[];
  destacado: boolean;
}

/** "$ 80.000", o el rango si las variantes no valen lo mismo. */
export function rangoDePrecio(desde: number | null, hasta: number | null, formatear: (v: number) => string): string | null {
  if (desde === null) return null;
  if (hasta === null || hasta === desde) return formatear(desde);
  return `${formatear(desde)} – ${formatear(hasta)}`;
}

export function nombreDeVariantePublica(v: { talla: string; color: string }): string {
  return [v.color, v.talla].filter(Boolean).join(" / ");
}
