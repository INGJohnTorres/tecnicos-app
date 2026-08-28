import { Space_Grotesk, Sora } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata = {
  title: "Visitas y Comisiones FTTH",
  description: "Registro de visitas y estimación de productividad para técnicos FTTH",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#090c16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${sora.variable}`}>
      <body>{children}</body>
    </html>
  );
}
