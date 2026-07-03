import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], weight: ["400","500","600","700","800","900"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "CineVault — Movie Watchlist",
  description: "Temukan, simpan, dan track film favoritmu. Powered by TMDB.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CineVault" },
};
export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                }
              })()
            `
          }}
        />
      </head>
      <body className={`${inter.variable} ${outfit.variable} bg-bg text-text antialiased`}>
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
      </body>
    </html>
  );
}
