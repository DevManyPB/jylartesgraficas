import { COOKIE_SESION, leerContactoCliente, leerSesion } from "@jyl/core/server";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { FormularioPedido } from "@/components/pedido/FormularioPedido";
import { serviciosPublicos } from "@/datos/cache";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Pedir un trabajo — JYL Artes Gráficos",
  description: "Cuéntanos qué necesitas y te respondemos con una cotización.",
};

export default async function Pedido() {
  const [servicios, sesion] = await Promise.all([
    serviciosPublicos(),
    leerSesion((await cookies()).get(COOKIE_SESION)?.value),
  ]);

  // Con cuenta, el paso 4 llega relleno (SPEC.md §4.5): lo que el cliente dejó
  // en su último pedido, y si es el primero, al menos su nombre y su correo.
  const contacto = sesion ? await leerContactoCliente(sesion.uid) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 pb-24 pt-28 sm:pt-32 lg:px-8">
      <FormularioPedido
        servicios={servicios}
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
