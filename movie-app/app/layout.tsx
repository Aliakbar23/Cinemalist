import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "CineVault — Movie Watchlist & Streaming",
  description: "Temukan, simpan, dan nonton film, K-Drama, dan Anime favoritmu. Powered by TMDB & Vidking.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CineVault" },
  other: {
    "mobile-web-app-capable": "yes",
    "format-detection": "telephone=no",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};
export const viewport: Viewport = {
  themeColor: "#0A0A0F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
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
      <body className="bg-bg text-text font-sans antialiased">
        <Navbar />
        <main className="min-h-screen pt-16">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </body>
    </html>
  );
}
