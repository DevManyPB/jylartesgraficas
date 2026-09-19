import { pedidoEntranteSchema } from "@jyl/core";
import { COOKIE_SESION, crearPedido, leerSesion } from "@jyl/core/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Crea un pedido — SPEC.md §4.5.
 *
 * Es público a propósito: continuar como invitado siempre está disponible.
 * El freno al abuso vive en las reglas de rate limiting de Cloudflare
 * (SPEC.md §2.4), que actúan en el borde sin gastar cuota de Firestore.
 */
export async function POST(request: Request) {
  const cuerpo = await request.json().catch(() => null);
  const datos = pedidoEntranteSchema.safeParse(cuerpo);

  if (!datos.success) {
    return NextResponse.json(
      {
        error: "Revisa los datos del pedido.",
        detalles: datos.error.issues.map((i) => ({
          campo: i.path.join("."),
          mensaje: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const sesion = await leerSesion((await cookies()).get(COOKIE_SESION)?.value);

  // Siempre hacen falta los datos de contacto, con o sin cuenta: sin teléfono
  // el estudio no tiene a quién llamar. Con cuenta se guardan en su ficha.
  if (!datos.data.invitado) {
    return NextResponse.json(
      { error: "Necesitamos tus datos de contacto para responderte." },
      { status: 400 },
    );
  }

  try {
    const pedido = await crearPedido(datos.data, {
      uid: sesion?.uid ?? null,
      email: sesion?.email ?? null,
    });
    return NextResponse.json(pedido, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No pudimos registrar el pedido. Inténtalo de nuevo en un momento." },
      { status: 500 },
    );
  }
}
