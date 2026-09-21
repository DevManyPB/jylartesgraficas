import { COOKIE_SESION, leerSesion } from "@jyl/core/server";
import { ModalProvider, ToastProvider } from "@jyl/ui";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { SiteFooter } from "@/components/footer/SiteFooter";
import { SiteHeader } from "@/components/header/SiteHeader";
import { BotonWhatsapp } from "@/components/whatsapp/BotonWhatsapp";
import { configuracionPublica } from "@/datos/cache";
import { numeroWhatsapp } from "@/lib/formato";
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
            <SiteHeader identidad={sesion?.nombre ?? sesion?.email ?? null} />
            {children}
            {whatsapp && <BotonWhatsapp numero={whatsapp} />}
            <SiteFooter />
          </ToastProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
