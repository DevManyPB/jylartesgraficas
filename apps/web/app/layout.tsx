import { COOKIE_SESION, leerSesion } from "@jyl/core/server";
import { ModalProvider, ToastProvider } from "@jyl/ui";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { SiteHeader } from "@/components/header/SiteHeader";
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
  title: "JYL Artes Gráficos",
  description: "Estudio de artes gráficas, desarrollo web y servicios técnicos.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const sesion = await leerSesion((await cookies()).get(COOKIE_SESION)?.value);
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      {/* `group` deja que el header lea con CSS si la página tiene héroe y en
          qué estado de scroll está, sin esperar a que hidrate el JS. */}
      <body className="group bg-canvas font-sans text-ink">
        <ModalProvider>
          <ToastProvider>
            <SiteHeader identidad={sesion?.nombre ?? sesion?.email ?? null} />
            {children}
          </ToastProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
