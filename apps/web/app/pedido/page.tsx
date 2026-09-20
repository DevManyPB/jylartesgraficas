import { COOKIE_SESION, leerContactoCliente, leerSesion } from "@jyl/core/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { normalizarWhatsapp } from "@jyl/core";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";
import type { ProductoElegido } from "@/components/pedido/PasoProducto";
import { configuracionPublica, productoPublico, serviciosPublicos } from "@/datos/cache";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Pedir un trabajo",
  description: "Cuéntanos qué necesitas y te respondemos con una cotización.",
};

const uno = (valor: string | string[] | undefined) => (Array.isArray(valor) ? valor[0] : valor);

/**
 * Se llega aquí de tres maneras: en blanco, desde un servicio
 * (`?servicio=`) o desde la tienda (`?producto=&variante=&cantidad=`).
 *
 * Lo que llega por la URL no se cree: el producto, la variante, el precio y
 * el stock se leen del catálogo aquí, en el servidor. Si algo no cuadra, el
 * formulario se abre en blanco en vez de con datos inventados.
 */
async function productoDeLaUrl(parametros: Record<string, string | string[] | undefined>): Promise<ProductoElegido | null> {
  const slug = uno(parametros.producto);
  const variantId = uno(parametros.variante);
  if (!slug || !variantId) return null;

  const producto = await productoPublico(slug);
  const variante = producto?.variantes.find((v) => v.id === variantId);
  if (!producto || !variante || variante.stock <= 0) return null;

  const pedidas = Number(uno(parametros.cantidad) ?? "1");
  const cantidad = Number.isInteger(pedidas) ? Math.min(Math.max(pedidas, 1), variante.stock) : 1;
  const portada = producto.imagenes[0];

  return {
    slug: producto.slug,
    precioUnitario: variante.precioVenta,
    imagen: portada ? { url: portada.url, alt: portada.alt } : null,
    item: {
      productId: producto.slug,
      variantId: variante.id,
      nombre: producto.nombre,
      talla: variante.talla || null,
      color: variante.color || null,
      cantidad,
      personalizado: uno(parametros.personalizado) === "1" && producto.permitePersonalizacion,
    },
  };
}

export default async function Pedido({ searchParams }: PageProps<"/pedido">) {
  const parametros = await searchParams;
  const [servicios, sesion, producto, configuracion] = await Promise.all([
    serviciosPublicos(),
    leerSesion((await cookies()).get(COOKIE_SESION)?.value),
    productoDeLaUrl(parametros),
    configuracionPublica(),
  ]);

  // Solo si parece un número completo: un enlace de WhatsApp a medias no sirve.
  const numeroWhatsapp = normalizarWhatsapp(configuracion.whatsapp);
  const whatsapp = /^\d{11,15}$/.test(numeroWhatsapp) ? numeroWhatsapp : null;

  const pedido = uno(parametros.servicio);
  const servicioInicial = servicios.some((s) => s.id === pedido) ? (pedido ?? null) : null;

  // Con cuenta, el paso 4 llega relleno (SPEC.md §4.5): lo que el cliente dejó
  // en su último pedido, y si es el primero, al menos su nombre y su correo.
  const contacto = sesion ? await leerContactoCliente(sesion.uid) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <FormularioPedido
        servicios={servicios}
        producto={producto}
        servicioInicial={servicioInicial}
        whatsapp={whatsapp}
        identidad={
          sesion
            ? {
                nombre: contacto?.nombre || sesion.nombre || "",
                email: sesion.email ?? "",
                telefono: contacto?.telefono ?? "",
                ciudad: contacto?.ciudad ?? "",
              }
            : null
        }
      />
    </main>
  );
}
