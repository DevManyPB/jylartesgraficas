import { getFirebaseAdmin } from "@jyl/core/server";
import { NextResponse } from "next/server";
import { exigirRol } from "@/servidor/sesion";

export const runtime = "nodejs";

/**
 * Canjea la cookie de sesión por un custom token para el SDK de cliente.
 *
 * El panel lee casi todo en el servidor, pero los pedidos nuevos tienen que
 * aparecer sin recargar (SPEC.md §13), y eso exige un listener de Firestore
 * en el navegador, que a su vez exige estar autenticado ahí. En lugar de
 * confiar en que la sesión del navegador siga viva por su cuenta, se deriva
 * de la cookie: así las dos nunca apuntan a personas distintas.
 *
 * Solo el personal: un cliente no tiene nada que escuchar en el panel.
 */
export async function POST() {
  const guardia = await exigirRol(["admin", "operador"]);
  if (!guardia.ok) return guardia.respuesta;

  try {
    const token = await getFirebaseAdmin().auth.createCustomToken(guardia.sesion.uid);
    return NextResponse.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "No pudimos preparar la conexión en vivo." }, { status: 500 });
  }
}
