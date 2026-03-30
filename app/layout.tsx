import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono, Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600", "900"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jb-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "QANUN — Regulatory Intelligence",
  description: "AI-powered regulatory intelligence and governance suite drafting for ADGM, VARA, and El Salvador. 65,822 provisions. Three jurisdictions. Zero hallucination.",
  metadataBase: new URL("https://qanun.vercel.app"),
  openGraph: {
    title: "QANUN — Regulatory Intelligence",
    description: "Research-grade regulatory analysis and complete governance suite generation. 65,822 provisions across three jurisdictions.",
    url: "https://qanun.vercel.app",
    siteName: "QANUN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QANUN — Regulatory Intelligence",
    description: "Research-grade regulatory intelligence and governance drafting for ADGM, VARA, and El Salvador.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
