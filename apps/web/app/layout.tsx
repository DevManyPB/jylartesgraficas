import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JYL Artes Gráficos",
  description: "Estudio de artes gráficas, desarrollo web y servicios técnicos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
