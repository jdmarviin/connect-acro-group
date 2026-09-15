export const dynamic = 'force-dynamic'
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import FloatingMenu from "@/components/FloatingMenu";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Acro Group - Connect",
  description: "Monitoramento de engajamento ao vivo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-acro-dark text-acro-silver flex flex-col`}
      >
        <main className="flex-1">
          {children}
        </main>
        <FloatingMenu />
      </body>
    </html>
  );
}
