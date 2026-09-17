import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel — JYL Artes Gráficos",
  description: "Pedidos, inventario y facturación de JYL Artes Gráficos.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
