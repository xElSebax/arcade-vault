import type { Metadata } from "next";
import {
  Courier_Prime,
  JetBrains_Mono,
  Press_Start_2P,
} from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

const courierPrime = Courier_Prime({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-courier",
});

export const metadata: Metadata = {
  title: "Arcade Vault · Portal Retro",
  description: "Plataforma web para jugar online y competir por la mayor cantidad de puntos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${pressStart2P.variable} ${jetbrainsMono.variable} ${courierPrime.variable} h-full`}
    >
      <body className="min-h-full">
        <div className="av-bg" aria-hidden="true" />
        <div className="av-noise" aria-hidden="true" />
        <div className="av-app">
          <AuthProvider>{children}</AuthProvider>
        </div>
      </body>
    </html>
  );
}
