import type { Metadata } from "next";
import Link from "next/link";
import { Apartado, PaginaLegal, PorDefinir } from "@/components/legal/Legal";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Términos y condiciones — JYL Artes Gráficos",
  description: "Cómo funcionan los pedidos, las cotizaciones y los productos del estudio.",
};

/** SPEC.md §11. Solo se afirma lo que el sitio hace de verdad; el resto queda marcado. */
export default function Terminos() {
  return (
    <PaginaLegal titulo="Términos y condiciones">
      <Apartado titulo="Qué es un pedido">
        <p>
          Enviar un pedido por este sitio es una <strong>solicitud</strong>, no una compra. No se cobra nada en línea:
          revisamos lo que nos mandas, te respondemos con una cotización y, si la apruebas, acordamos el pago por
          WhatsApp o en el local.
        </p>
        <p>
          Al enviar el pedido recibes un número para hacerle seguimiento. Que un pedido llegue no garantiza por sí solo
          que podamos hacerlo: te lo confirmamos al cotizarlo.
        </p>
      </Apartado>

      <Apartado titulo="Precios y disponibilidad">
        <p>
          Los precios de la tienda son de referencia y se confirman al cotizar. Lo que aparece como agotado no está
          disponible en ese momento; puedes preguntarnos por él.
        </p>
        <PorDefinir>
          cuánto tiempo se mantiene un precio cotizado y si se pide anticipo para empezar un trabajo.
        </PorDefinir>
      </Apartado>

      <Apartado titulo="Archivos que nos envías">
        <p>
          Al adjuntar imágenes o documentos nos autorizas a usarlos para hacer tu trabajo. Al hacerlo declaras que
          tienes derecho a usarlos: no revisamos la titularidad de lo que se sube.
        </p>
      </Apartado>

      <Apartado titulo="Diseños, revisiones y plazos">
        <PorDefinir>
          de quién son los archivos editables del diseño una vez pagado el trabajo, cuántas revisiones incluye cada
          servicio y qué plazos de entrega se comprometen.
        </PorDefinir>
      </Apartado>

      <Apartado titulo="Productos físicos">
        <PorDefinir>
          condiciones de cambio, garantía y devolución de los productos de la tienda, sobre todo de los
          personalizados.
        </PorDefinir>
      </Apartado>

      <Apartado titulo="Tus datos">
        <p>
          Cómo tratamos la información que nos das está en la{" "}
          <Link href="/privacidad" className="font-medium text-accent underline underline-offset-4">
            política de privacidad
          </Link>
          .
        </p>
      </Apartado>
    </PaginaLegal>
  );
}
