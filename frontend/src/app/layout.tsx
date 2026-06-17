import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Nunito } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: 'swap',
});

// Nunito = substitusi open-source SF Pro Rounded (heading) sesuai DESIGN-ollama.md.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-nunito",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "WiFi Hotspot Management — Admin Panel",
  description: "Sistem Manajemen WiFi Hotspot Multi-Router MikroTik Modern Terintegrasi POS + AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${nunito.variable} font-sans antialiased bg-canvas text-body`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
