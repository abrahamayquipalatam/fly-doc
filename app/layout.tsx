import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyDoc - Explorador de Archivos Corporativo",
  description: "Explorador de archivos tipo Windows 11 para Google Drive",
};

import { CommandPalette } from "../components/CommandPalette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
