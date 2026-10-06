import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cookies } from "next/headers";

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
  title: "Acro Group Connect — Sal trading an dirèk",
  description: "Swiv sal trading yo an dirèk, prezans ak angajman kominote ou nan yon sèl panèl.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const documentLanguage = cookieStore.get("NEXT_LOCALE")?.value === "pt" ? "pt-BR" : "ht";

  return (
    <html lang={documentLanguage}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-acro-dark text-acro-silver flex flex-col`}
      >
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
