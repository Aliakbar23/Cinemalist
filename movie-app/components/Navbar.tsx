"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { checkPendingReminders } from "@/lib/db";

const LINKS = [
  { href: "/", label: "Beranda", icon: "🏠" },
  { href: "/search", label: "Cari Film", icon: "🔍" },
  { href: "/watchlist", label: "Watchlist", icon: "🎬" },
  { href: "/genre/28", label: "Genre", icon: "🎭" },
  { href: "/bot", label: "CineBot", icon: "🤖" },
];

export default function Navbar() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js")
          .then((reg) => console.log("SW registered:", reg.scope))
          .catch((err) => console.error("SW registration error:", err));
      }
      checkPendingReminders();
    }
  }, []);

  useEffect(() => {
    const current = document.documentElement.classList.contains("light") ? "light" : "dark";
    setTheme(current);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "light") {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass border-b border-white/5 shadow-cinema" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl animate-bounce">🎬</span>
            <span className="font-display text-xl font-black text-gradient">CineVault</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => {
              const active = path === l.href || (l.href !== "/" && path.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-colors
                  ${active ? "text-text font-bold" : "text-muted hover:text-soft"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-purple/10 border border-purple/30"
                    />
                  )}
                  <span className="relative z-10">{l.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Desktop search & Theme Toggle */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-sm text-muted hover:text-text hover:border-purple/50 transition-all"
            >
              <span>🔍</span>
              <span>Cari film...</span>
              <kbd className="ml-2 rounded bg-card px-1.5 py-0.5 text-xs text-muted">⌘K</kbd>
            </Link>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border text-lg hover:border-purple/50 transition-all shadow-cinema-sm"
              title="Ganti Tema"
            >
              {theme === "light" ? "🎨" : "🌙"}
            </motion.button>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border text-base shadow-cinema-sm"
            >
              {theme === "light" ? "🎨" : "🌙"}
            </motion.button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex flex-col gap-1.5 p-2"
            >
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-5 bg-text origin-center transition-all"
              />
              <motion.span
                animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                className="block h-0.5 w-5 bg-text"
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-5 bg-text origin-center transition-all"
              />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-14 z-40 glass border-b border-white/5 px-4 py-4 md:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.div
                key={l.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors
                  ${path === l.href ? "bg-purple/10 text-text border border-purple/30 font-bold" : "text-soft hover:bg-surface"}`}
                >
                  <span className="text-lg">{l.icon}</span>
                  {l.label}
                </Link>
              </motion.div>
            ))}

            {/* Mobile Theme Switcher Row */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: LINKS.length * 0.06 }}
              className="mt-3 pt-3 border-t border-border"
            >
              <button
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-colors text-soft hover:bg-surface"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{theme === "light" ? "🎨" : "🌙"}</span>
                  <span>Tema: {theme === "light" ? "Playful Light" : "Cinematic Dark"}</span>
                </div>
                <span className="rounded-lg bg-purple/10 border border-purple/30 px-2 py-0.5 text-xs text-purple-light">
                  Ubah
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
