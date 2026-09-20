import "server-only";

import type { DocumentData } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../firebase/admin";
import { aImagenes } from "./imagenes";
import type { ProductoPublico, ProductoPublicoConVariantes, ProyectoPublico, VariantePublica } from "./publico";

/**
 * Lo que el sitio público lee del catálogo. Solo lo publicado, y solo los
 * campos que el público puede ver: el costo unitario de una variante es
 * finanzas y no sale de aquí, ni siquiera dentro de un objeto más grande
 * (viajaría al navegador en la carga del Server Component).
 *
 * Quien llama envuelve esto en la caché de Next con su etiqueta: un visitante
 * no debe generar lecturas de Firestore (SPEC.md §2.7).
 */

const db = () => getFirebaseAdmin().db;

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const numONulo = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const txt = (v: unknown) => (typeof v === "string" ? v : "");

function aProductoPublico(id: string, d: DocumentData): ProductoPublico {
  return {
    slug: id,
    nombre: txt(d.nombre),
    categoria: txt(d.categoria),
    descripcion: txt(d.descripcion),
    imagenes: aImagenes(d.imagenes),
    permitePersonalizacion: d.permitePersonalizacion === true,
    precioDesde: numONulo(d.precioDesde),
    precioHasta: numONulo(d.precioHasta),
    stockTotal: num(d.stockTotal),
  };
}

/** Los productos de la tienda, en el orden que fijó el estudio. */
export async function leerProductosPublicos(): Promise<ProductoPublico[]> {
  const consulta = await db().collection("products").where("activo", "==", true).orderBy("orden").get();
  return consulta.docs.map((d) => aProductoPublico(d.id, d.data()));
}

/** Un producto con sus variantes activas. `null` si no existe o no está publicado. */
export async function leerProductoPublico(slug: string): Promise<ProductoPublicoConVariantes | null> {
  const referencia = db().collection("products").doc(slug);
  const [documento, variantes] = await Promise.all([
    referencia.get(),
    referencia.collection("variants").orderBy("orden").get(),
  ]);
  if (!documento.exists || documento.data()!.activo !== true) return null;

  return {
    ...aProductoPublico(documento.id, documento.data()!),
    variantes: variantes.docs.flatMap((v): VariantePublica[] => {
      const d = v.data();
      if (d.activo === false) return [];
      return [
        {
          id: v.id,
          talla: txt(d.talla),
          color: txt(d.color),
          sku: txt(d.sku),
          precioVenta: num(d.precioVenta),
          stock: num(d.stock),
        },
      ];
    }),
  };
}

function aProyectoPublico(id: string, d: DocumentData): ProyectoPublico {
  return {
    slug: id,
    titulo: txt(d.titulo),
    categoria: txt(d.categoria),
    cliente: txt(d.cliente),
    descripcion: txt(d.descripcion),
    imagenes: aImagenes(d.imagenes),
    destacado: d.destacado === true,
  };
}

export async function leerProyectosPublicos(): Promise<ProyectoPublico[]> {
  const consulta = await db().collection("portfolio").where("publicado", "==", true).orderBy("orden").get();
  return consulta.docs.map((d) => aProyectoPublico(d.id, d.data()));
}
