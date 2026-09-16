import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import Script from "next/script";

import { ThemeProvider } from "@/components/layout/theme-provider";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DocAI",
  description: "AI-powered document assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Script id="docai-theme" strategy="beforeInteractive">
          {`
            try {
              const saved = localStorage.getItem("docai-theme");
              const dark = saved
                ? saved === "dark"
                : window.matchMedia("(prefers-color-scheme: dark)").matches;
              document.documentElement.classList.toggle("dark", dark);
            } catch {}
          `}
        </Script>
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}