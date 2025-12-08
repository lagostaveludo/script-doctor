import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Script Doctor",
  description: "AI-powered writing assistant for screenwriters",
};

const APP_VERSION = "0.1.2"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Version indicator */}
        <div className="fixed top-2 left-2 text-xs text-white bg-pink-600 px-2 py-1 rounded">
          Script Doctor v{APP_VERSION}
        </div>
      </body>
    </html>
  );
}
