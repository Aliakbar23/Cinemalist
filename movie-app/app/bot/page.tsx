"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { searchMovies, posterUrl, rating, year, type Movie } from "@/lib/api";

interface Message {
  role: "user" | "bot";
  content: string;
  movies?: { movie: Movie; reason: string }[];
}

export default function BotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "Halo! Aku CineBot 🤖. Lagi bingung mau nonton apa hari ini? Ceritakan suasana hatimu atau genre film yang ingin kamu cari!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [hasServerKey, setHasServerKey] = useState(true); // assume server key exists
  const [showKeyModal, setShowKeyModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load custom user key from localStorage if previously saved
    const savedKey = localStorage.getItem("gemini_api_key") || "";
    setCustomKey(savedKey);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSaveKey = (key: string) => {
    const trimmed = key.trim();
    setCustomKey(trimmed);
    if (trimmed) {
      localStorage.setItem("gemini_api_key", trimmed);
    } else {
      localStorage.removeItem("gemini_api_key");
    }
    setShowKeyModal(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      // Call the server-side API route (key is safe on server)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userMessage,
          // Only send custom key if user explicitly set one
          ...(customKey ? { customKey } : {}),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        
        // If 500 with no key configured, server has no GEMINI_KEY
        if (response.status === 500 && !customKey) {
          setHasServerKey(false);
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              content: "Oops! API Key Gemini belum dikonfigurasi di server. Klik tombol pengaturan ⚙️ di pojok kanan atas untuk memasang API Key Google AI Studio gratis agar aku bisa bekerja!",
            },
          ]);
          setLoading(false);
          return;
        }

        throw new Error(errData.error || "Gagal menghubungi CineBot API");
      }

      const resData = await response.json();
      const rawText = resData.result || "[]";

      // Parse JSON response from Gemini
      const jsonRes = JSON.parse(rawText.trim());

      // Check response type (chat or movie recommendations)
      if (Array.isArray(jsonRes)) {
        const isChat = jsonRes.some((item) => item.chatResponse);

        if (isChat) {
          const chatMsg = jsonRes.find((item) => item.chatResponse)?.chatResponse || "Ada yang bisa kubantu tentang film?";
          setMessages((prev) => [...prev, { role: "bot", content: chatMsg }]);
        } else {
          // Search TMDB for each recommendation
          const moviePromises = jsonRes.map(async (rec: { title: string; reason: string }) => {
            if (!rec.title) return null;
            try {
              const searchRes = await searchMovies(rec.title);
              if (searchRes.results.length > 0) {
                return {
                  movie: searchRes.results[0],
                  reason: rec.reason,
                };
              }
            } catch (err) {
              console.error("Gagal memuat film TMDB:", rec.title, err);
            }
            return null;
          });

          const movieResults = (await Promise.all(moviePromises)).filter(Boolean) as {
            movie: Movie;
            reason: string;
          }[];

          if (movieResults.length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                role: "bot",
                content: `Berikut film rekomendasi pilihan terbaikku untukmu:`,
                movies: movieResults,
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                role: "bot",
                content: "Aku menemukan beberapa film, namun datanya tidak dapat ditemukan di TMDB. Coba tanyakan kriteria film lainnya!",
              },
            ]);
          }
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: "Maaf, format respon AI terganggu. Silakan kirim ulang pesan Anda.",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          content: "Terjadi kesalahan koneksi atau API Key salah. Pastikan API Key valid dan coba kirim kembali.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const isReady = hasServerKey || !!customKey;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto px-4 py-4 md:py-6">
      {/* Bot Header */}
      <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple/10 border border-purple/30 text-2xl animate-pulse">
            🤖
          </div>
          <div>
            <h1 className="font-display font-black text-text text-lg leading-tight">CineBot AI</h1>
            <p className="text-xs text-muted">Asisten film pintar bertenaga Gemini 2.5</p>
          </div>
        </div>

        {/* Settings button */}
        <motion.button
          whileHover={{ scale: 1.05, rotate: 30 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowKeyModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border text-lg hover:border-purple/50 transition-all text-muted hover:text-text"
          title="Pengaturan API Key"
        >
          ⚙️
        </motion.button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-1">
        {[
          "🇰🇷 Rekomendasikan Drama Korea Romantis Terbaik",
          "🌸 Rekomendasi Anime Action Populer HD",
          "🚀 Film Sci-Fi Plot Twist Paling Bagus",
          "👻 Film Horor Indonesia / Barat Seram",
        ].map((promptText, i) => (
          <button
            key={i}
            onClick={() => setInput(promptText)}
            className="flex-shrink-0 rounded-full glass border border-purple/20 px-3 py-1 text-xs text-purple-light hover:bg-purple/10 hover:border-purple/40 transition-all"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-hide">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border shadow-cinema-sm
              ${
                msg.role === "user"
                  ? "bg-purple border-purple text-white rounded-tr-none"
                  : "bg-card border-border text-text rounded-tl-none"
              }`}
            >
              {msg.content}
            </div>

            {/* Movie recommendations layout */}
            {msg.movies && msg.movies.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {msg.movies.map(({ movie, reason }, idx) => {
                  const poster = posterUrl(movie.poster_path);
                  return (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="card overflow-hidden flex gap-3 p-3 hover:scale-102 transition-transform"
                    >
                      {/* Poster */}
                      <Link href={`/movie/${movie.id}`} className="relative h-28 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-card">
                        {poster ? (
                          <Image src={poster} alt={movie.title} fill sizes="80px" className="object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xl bg-surface">🎬</div>
                        )}
                      </Link>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <Link href={`/movie/${movie.id}`}>
                            <h3 className="font-display font-bold text-text text-sm leading-tight hover:text-purple transition-colors truncate">
                              {movie.title}
                            </h3>
                          </Link>
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                            <span className="text-gold">★</span>
                            <span className="text-soft font-semibold">{rating(movie.vote_average)}</span>
                            <span>·</span>
                            <span>{year(movie.release_date)}</span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-muted line-clamp-3 leading-relaxed">
                            {reason}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted text-xs bg-card border border-border rounded-xl px-4 py-2 w-max animate-pulse">
            <span>🤖 CineBot sedang mengetik...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 relative">
        <input
          type="text"
          placeholder={isReady ? "Tanyakan rekomendasi film..." : "Masukkan API Key di pengaturan untuk memulai..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!isReady || loading}
          className="flex-1 rounded-2xl bg-surface border border-border px-4 py-4 text-text text-sm outline-none focus:border-purple/60 focus:ring-2 focus:ring-purple/20 transition-all placeholder:text-muted disabled:opacity-50"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={!isReady || !input.trim() || loading}
          className="rounded-2xl bg-cinema text-white font-semibold font-display px-6 py-4 transition-all shadow-cinema hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] disabled:opacity-50 flex items-center gap-1"
        >
          Kirim 🚀
        </motion.button>
      </form>

      {/* API Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div
              initial={{ scale: 0.85 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.85 }}
              className="card p-6 w-full max-w-md"
            >
              <h2 className="font-display font-black text-text text-lg mb-2">🔑 Pengaturan API Key</h2>
              <p className="text-xs text-muted mb-1 leading-relaxed">
                CineBot menggunakan API Key Gemini yang dikonfigurasi di server secara default.
                Jika kamu ingin menggunakan API Key pribadi, tempelkan di bawah ini.
              </p>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                Dapatkan kunci gratis di{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-light hover:underline font-semibold"
                >
                  Google AI Studio
                </a>
                . Kosongkan untuk menggunakan key default server.
              </p>

              <input
                type="password"
                placeholder="Tempel API Key AI Studio disini (opsional)..."
                defaultValue={customKey}
                id="api-key-input"
                className="w-full rounded-xl bg-surface border border-border px-4 py-3 text-text text-sm outline-none focus:border-purple/60 placeholder:text-muted mb-2"
              />

              {customKey && (
                <p className="text-[11px] text-green-400 mb-4">✓ Menggunakan API Key pribadi kamu</p>
              )}
              {!customKey && (
                <p className="text-[11px] text-muted mb-4">ℹ Menggunakan API Key default server</p>
              )}

              <div className="flex items-center justify-end gap-2 text-sm font-semibold">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-muted hover:text-text hover:bg-surface transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById("api-key-input") as HTMLInputElement;
                    handleSaveKey(el?.value || "");
                  }}
                  className="rounded-xl bg-cinema px-5 py-2.5 text-white shadow-cinema hover:shadow-[0_0_30px_rgba(124,58,237,0.4)]"
                >
                  Simpan & Hubungkan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
