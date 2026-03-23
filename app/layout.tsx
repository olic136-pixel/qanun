import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "QANUN — Regulatory Intelligence",
  description: "Research-grade regulatory analysis for ADGM, DIFC, and emerging financial markets. 10-agent pipeline. 63,397 provisions. Results in 90 seconds.",
  metadataBase: new URL("https://qanun.vercel.app"),
  openGraph: {
    title: "QANUN — Regulatory Intelligence",
    description: "Research-grade regulatory analysis. 10-agent pipeline across 63,397 provisions.",
    url: "https://qanun.vercel.app",
    siteName: "QANUN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "QANUN — Regulatory Intelligence",
    description: "Research-grade regulatory analysis for ADGM, DIFC, and emerging markets.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
