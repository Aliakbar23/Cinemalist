"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { searchMovies, getPopular, getMoviesByMood, type Movie } from "@/lib/api";
import MovieGrid from "@/components/MovieGrid";
import { MovieGridSkeleton } from "@/components/Skeletons";

const SUGGESTIONS = ["Squid Game", "One Piece", "Avengers", "Queen of Tears", "Spider-Man", "Attack on Titan", "Inception", "John Wick"];

const MOODS_MAP: Record<string, { label: string; emoji: string }> = {
  mikir: { label: "Butuh Mikir Keras", emoji: "🧩" },
  santai: { label: "Teman Bersantai", emoji: "🍿" },
  romantis: { label: "Kencan Romantis", emoji: "❤️" },
  adrenalin: { label: "Pompa Adrenalin", emoji: "⚡" },
  seram: { label: "Uji Nyali", emoji: "👻" },
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getPopular().then((r) => setPopular(r.results));
    inputRef.current?.focus();

    // Cek query mood saat pertama kali render
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const moodParam = params.get("mood");
      if (moodParam && MOODS_MAP[moodParam]) {
        setActiveMood(moodParam);
        setLoading(true);
        getMoviesByMood(moodParam).then((data) => {
          setResults(data.results);
          setTotal(data.total_results);
          setHasMore(data.total_pages > 1);
          setLoading(false);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      // Jika ada activeMood dan query dihapus, jangan kosongkan hasil
      if (activeMood) return;
      
      setResults([]);
      setTotal(0);
      setPage(1);
      return;
    }
    
    // Jika user mengetik pencarian baru, matikan filter mood
    if (activeMood) {
      setActiveMood(null);
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setPage(1);
      try {
        const data = await searchMovies(query, "1");
        setResults(data.results);
        setTotal(data.total_results);
        setHasMore(data.total_pages > 1);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query, activeMood]);

  const loadMore = async () => {
    const nextPage = page + 1;
    setLoading(true);
    const data = activeMood
      ? await getMoviesByMood(activeMood, String(nextPage))
      : await searchMovies(query, String(nextPage));
      
    setResults((prev) => [...prev, ...data.results]);
    setPage(nextPage);
    setHasMore(nextPage < data.total_pages);
    setLoading(false);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda tidak mendukung Pencarian Suara.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(30); // Getar halus saat mulai mendengarkan
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-black text-text mb-6 md:text-4xl">
          🔍 Cari Film
        </h1>

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg">🔍</span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Cari judul film..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl bg-surface border border-border pl-12 pr-24 py-4 text-text text-base outline-none focus:border-purple/60 focus:ring-2 focus:ring-purple/20 transition-all placeholder:text-muted"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-muted hover:text-text text-xl p-1"
              >
                ✕
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={startVoiceSearch}
              className={`p-2 rounded-xl transition-all ${
                isListening 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-card border border-border text-muted hover:text-text"
              }`}
              title="Cari dengan Suara"
            >
              🎤
            </motion.button>
          </div>
        </div>

        {/* Suggestions */}
        {!query && !activeMood && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="rounded-full glass border border-white/5 px-3 py-1.5 text-sm text-soft hover:text-text hover:border-purple/40 transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {query || activeMood ? (
          <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading && results.length === 0 ? (
              <MovieGridSkeleton count={12} />
            ) : results.length > 0 ? (
              <>
                <p className="mb-5 text-sm text-muted">
                  {activeMood ? (
                    <span>
                      Rekomendasi untuk suasana hati:{" "}
                      <span className="text-purple-light font-bold">
                        {MOODS_MAP[activeMood]?.emoji} {MOODS_MAP[activeMood]?.label}
                      </span>
                    </span>
                  ) : (
                    <span>
                      <span className="text-text font-semibold">{total.toLocaleString()}</span> hasil untuk "
                      <span className="text-purple-light">{query}</span>"
                    </span>
                  )}
                </p>
                <MovieGrid movies={results} />

                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="rounded-xl bg-cinema px-8 py-3 font-display font-semibold text-white shadow-cinema hover:shadow-[0_0_40px_rgba(124,58,237,0.5)] transition-all disabled:opacity-60"
                    >
                      {loading ? "Memuat..." : "Muat Lebih Banyak"}
                    </button>
                  </div>
                )}
              </>
            ) : !loading ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-20 text-center"
              >
                <p className="text-5xl mb-4">🎬</p>
                <p className="text-xl font-display font-bold text-text">Film tidak ditemukan</p>
                <p className="mt-2 text-muted">Coba judul lain atau periksa ejaan</p>
              </motion.div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div key="popular" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MovieGrid movies={popular} title="🔥 Film Populer" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
