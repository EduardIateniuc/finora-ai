import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PageTransition from "./components/PageTransition";
import ClientBackground from "./components/ClientBackground"; // Статический импорт обертки

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Finora AI — Personal Financial Copilot",
  description: "Next-gen AI capital optimization platform",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0e0f13] text-white overflow-x-hidden">
        
        {/* Глобальное персистентное 3D-кольцо через безопасную клиентскую обертку */}
        <ClientBackground />

        {/* Плавные переходы для текстового наполнения страниц */}
        <PageTransition>
          {children}
        </PageTransition>

      </body>
    </html>
  );
}