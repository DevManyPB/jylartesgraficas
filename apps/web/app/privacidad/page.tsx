import type { Metadata } from "next";
import { Apartado, PaginaLegal, PorDefinir } from "@/components/legal/Legal";
import { configuracionPublica } from "@/datos/cache";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Privacidad — JYL Artes Gráficos",
  description: "Qué datos pedimos, para qué los usamos y cómo pedir que los borremos.",
};

/** SPEC.md §11. Lo que se afirma aquí se corresponde con lo que el sitio guarda de verdad. */
export default async function Privacidad() {
  const configuracion = await configuracionPublica();

  return (
    <PaginaLegal titulo="Política de privacidad">
      <Apartado titulo="Qué datos pedimos">
        <p>
          Para responder un pedido pedimos tu <strong>nombre, correo, teléfono y ciudad</strong>, además de lo que
          escribas y los archivos que adjuntes. Si creas una cuenta, guardamos también tu correo y tu nombre para que
          puedas ver tu historial.
        </p>
        <p>
          El sitio usa una cookie propia para mantener tu sesión iniciada. No usamos cookies de publicidad ni de
          seguimiento de terceros.
        </p>
      </Apartado>

      <Apartado titulo="Para qué los usamos">
        <p>
          Para responderte, hacer el trabajo, entregarlo y facturarlo. No vendemos ni cedemos tus datos a terceros para
          publicidad.
        </p>
      </Apartado>

      <Apartado titulo="Dónde se guardan">
        <p>
          Los pedidos y los datos de contacto se guardan en Firebase, de Google, y los archivos que adjuntas en
          Cloudinary. Los dos son proveedores con servidores fuera de Colombia.
        </p>
      </Apartado>

      <Apartado titulo="Cuánto tiempo los conservamos">
        <PorDefinir>
          cuánto tiempo se guardan los pedidos, los archivos adjuntos y las facturas antes de borrarlos.
        </PorDefinir>
      </Apartado>

      <Apartado titulo="Tus derechos">
        <p>
          Puedes pedirnos ver, corregir o borrar tus datos{" "}
          {configuracion.email ? (
            <>
              escribiendo a{" "}
              <a href={`mailto:${configuracion.email}`} className="font-medium text-accent underline underline-offset-4">
                {configuracion.email}
              </a>
            </>
          ) : (
            "escribiéndonos por los medios de contacto del sitio"
          )}
          . Si tienes cuenta, puedes editar tus datos desde «Mi cuenta».
        </p>
        <PorDefinir>
          el nombre y el documento de la empresa como responsable del tratamiento, y el plazo de respuesta a estas
          solicitudes.
        </PorDefinir>
      </Apartado>
    </PaginaLegal>
  );
}
