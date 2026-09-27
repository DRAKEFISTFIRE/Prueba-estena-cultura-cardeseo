import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Estrena Cultura",
  description: "Programa cultural per a joves de Barcelona"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ca" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}