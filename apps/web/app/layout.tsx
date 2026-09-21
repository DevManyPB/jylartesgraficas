import { esPersonal } from "@jyl/core";
import { COOKIE_SESION, leerSesion } from "@jyl/core/server";
import { ModalProvider, ToastProvider } from "@jyl/ui";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { ViewTransition } from "react";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteHeader } from "@/components/header/SiteHeader";
import { BotonWhatsapp } from "@/components/whatsapp/BotonWhatsapp";
import { configuracionPublica } from "@/datos/cache";
import { enlaceWhatsapp, numeroWhatsapp } from "@/lib/formato";
import { PANEL_URL } from "@/lib/panel";
import { SITIO_URL } from "@/lib/sitio";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  // Con esto, las imágenes de Open Graph de cada página se resuelven a
  // direcciones absolutas, que es lo único que entienden las redes.
  metadataBase: new URL(SITIO_URL),
  title: {
    default: "JYL Artes Gráficos",
    template: "%s — JYL Artes Gráficos",
  },
  description: "Estudio de artes gráficas, desarrollo web y servicios técnicos.",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "JYL Artes Gráficos",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [sesion, configuracion] = await Promise.all([
    leerSesion((await cookies()).get(COOKIE_SESION)?.value),
    configuracionPublica(),
  ]);
  const whatsapp = numeroWhatsapp(configuracion.whatsapp);
  const contacto = {
    whatsapp: enlaceWhatsapp(configuracion.whatsapp),
    telefono: configuracion.telefono,
    email: configuracion.email,
    redes: Object.entries(configuracion.redes).filter(([, url]) => url) as [string, string][],
  };
  return (
    // `scroll-smooth` solo con motion-safe: los saltos a un ancla se ven
    // mejor deslizando, pero quien pidió menos movimiento no lo quiere.
    // `data-scroll-behavior` es lo que le dice a Next que no deslice también
    // al cambiar de página, donde el salto tiene que ser instantáneo.
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${inter.variable} motion-safe:scroll-smooth`}
    >
      {/* `group` deja que el header lea con CSS si la página tiene héroe y en
          qué estado de scroll está, sin esperar a que hidrate el JS. */}
      <body className="group bg-canvas font-sans text-ink">
        <ModalProvider>
          <ToastProvider>
            <SiteHeader
              identidad={
                sesion
                  ? {
                      nombre: sesion.nombre,
                      email: sesion.email,
                      // El rol se comprueba aquí, en el servidor. Al navegador
                      // solo le llega la dirección si de verdad tiene acceso.
                      panel: esPersonal(sesion.rol) ? PANEL_URL : null,
                    }
                  : null
              }
              contacto={contacto}
            />
            {/* Entre páginas, el contenido se funde en vez de saltar —
                SPEC.md §9: el movimiento responde a una acción del usuario y
                muestra qué cambió. Es la API del navegador (View Transitions)
                a través de React, así que la anima el compositor y no cuesta
                JavaScript. Sin soporte del navegador, la navegación sigue
                siendo instantánea: no hay nada que se rompa. */}
            {/* `update="none"`: esta envoltura solo anima al cambiar de
                página. Sin ello, cualquier cambio de estado de dentro —los
                pasos del formulario de pedido, por ejemplo— fundiría también
                la página entera. */}
            <ViewTransition default="pagina" update="none">
              {children}
            </ViewTransition>
            {whatsapp && <BotonWhatsapp numero={whatsapp} />}
            <SiteFooter />
          </ToastProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
