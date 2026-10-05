import type { Metadata } from "next";
import { Bricolage_Grotesque, Atkinson_Hyperlegible } from "next/font/google";
import "./globals.css";

const titulo = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-titulo", weight: ["500", "700"] });
const texto = Atkinson_Hyperlegible({ subsets: ["latin"], variable: "--f-texto", weight: ["400", "700"] });

export const metadata: Metadata = {
  title: "Encuesta anónima de clima laboral",
  description: "Cuéntanos cómo es trabajar aquí. Tus respuestas son anónimas.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${titulo.variable} ${texto.variable}`}>
      <body>{children}</body>
    </html>
  );
}
