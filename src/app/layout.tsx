import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { LangProvider } from "@/lib/i18n/LangContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GCRM Exchange - Premier Crypto Trading Platform",
  description: "Trade GCRM, QFS, and ALARAB on-chain. Institutional-grade trading with real smart contracts on Ethereum & Polygon.",
  icons: {
    icon: "https://z-cdn-media.chatglm.cn/files/183aca72-652a-4fb0-8148-26b55cfb4f89.png?auth_key=1886312091-670fa9ca9dd04b1cb8bb02406b13d51e-0-7545d0569b9830c4db90f76509462881",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: "var(--bg-primary, #050608)", color: "var(--text-primary, #fff)" }}
      >
        <ThemeProvider>
          <LangProvider>
            {children}
            <Toaster />
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
