export const metadata = {
  title: "Visitas y Comisiones FTTH",
  description: "Registro de visitas y estimación de productividad para técnicos FTTH",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#111111",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
