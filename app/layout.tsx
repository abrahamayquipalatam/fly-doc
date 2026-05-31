import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlyDoc by LATAM Airlines",
  description: "Explorador de archivos tipo Windows 11 para Google Drive",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FlyDoc",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#2A0087",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { CommandPalette } from "../components/CommandPalette";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <CommandPalette />
      </body>
    </html>
  );
}
