"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMovieDetail, getMovieCredits, getMovieVideos, getSimilar,
  posterUrl, year, rating, runtime,
  type MovieDetail, type CastMember, type Video, type Movie,
} from "@/lib/api";
import {
  addToWatchlist, removeFromWatchlist, getWatchlistItem, updateStatus, updateRating,
  addReminder, removeReminder, getReminder,
  type WatchlistItem, type WatchStatus,
} from "@/lib/db";
import MovieRow from "@/components/MovieRow";
import { DetailSkeleton } from "@/components/Skeletons";

const STATUS_OPTS: { key: WatchStatus; label: string; icon: string; color: string }[] = [
  { key: "want", label: "Mau Nonton", icon: "🔖", color: "bg-blue-600" },
  { key: "watching", label: "Sedang Nonton", icon: "▶", color: "bg-orange-500" },
  { key: "done", label: "Sudah Nonton", icon: "✓", color: "bg-green-600" },
];

function TrailerModal({ videoKey, onClose }: { videoKey: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
          >
            ✕
          </button>
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function RatingStars({
  value, onChange,
}: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5,6,7,8,9,10].map((s) => (
        <button
          key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className={`text-xl transition-colors ${
            s <= (hover || value) ? "text-gold" : "text-border"
          }`}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-bold text-gold">{value}/10</span>
      )}
    </div>
  );
}

// Helper untuk wrap text di Canvas
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n] + " ";
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const movieId = Number(id);

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [watchItem, setWatchItem] = useState<WatchlistItem | null>(null);
  const [hasReminder, setHasReminder] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [trailer, setTrailer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  // States untuk Share Card Canvas
  const [showShareModal, setShowShareModal] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, credits, vids, sim, wi, rem] = await Promise.all([
        getMovieDetail(movieId),
        getMovieCredits(movieId),
        getMovieVideos(movieId),
        getSimilar(movieId),
        getWatchlistItem(movieId),
        getReminder(movieId),
      ]);
      setMovie(m);
      setCast(credits.cast.slice(0, 12));
      setVideos(vids.results);
      setSimilar(sim.results.slice(0, 14));
      setWatchItem(wi ?? null);
      setHasReminder(!!rem);
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => { 
    loadData(); 
  }, [loadData]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Mempersiapkan Canvas saat modal dibuka
  useEffect(() => {
    if (showShareModal && movie) {
      setCanvasReady(false);
      setTimeout(() => {
        generateCanvas();
      }, 400);
    }
  }, [showShareModal, movie]);

  const trailerVideo = videos.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser") && v.official
  ) ?? videos.find((v) => v.site === "YouTube");

  const handleWatchlist = async (status: WatchStatus) => {
    if (!movie) return;
    if (watchItem) {
      await updateStatus(movie.id, status);
      setWatchItem((prev) => prev ? { ...prev, status } : null);
    } else {
      const item = {
        id: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average,
        overview: movie.overview,
        status,
      };
      await addToWatchlist(item);
      setWatchItem({ ...item, addedAt: Date.now() });
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (status === "done") {
        navigator.vibrate([20, 50, 20]);
      } else {
        navigator.vibrate(15);
      }
    }
  };

  const handleRemove = async () => {
    if (!movie) return;
    await removeFromWatchlist(movie.id);
    setWatchItem(null);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleRatingSave = async (note: string) => {
    if (!movie) return;
    await updateRating(movie.id, selectedRating, note);
    setWatchItem((prev) => prev ? { ...prev, userRating: selectedRating, note } : {
      id: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date,
      voteAverage: movie.vote_average,
      overview: movie.overview,
      status: "want",
      userRating: selectedRating,
      note,
      addedAt: Date.now()
    });
    setShowRating(false);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(8);
    }
  };

  const handleToggleReminder = async () => {
    if (!movie) return;
    if (hasReminder) {
      await removeReminder(movie.id);
      setHasReminder(false);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } else {
      if (typeof window !== "undefined" && "Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("Silakan aktifkan izin notifikasi pada pengaturan browser Anda untuk menyalakan pengingat.");
          return;
        }
      }
      await addReminder({
        id: movie.id,
        title: movie.title,
        releaseDate: movie.release_date,
        posterPath: movie.poster_path,
      });
      setHasReminder(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([20, 40, 20]);
      }
    }
  };

  const toggleSpeech = () => {
    if (!movie || !movie.overview) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(movie.overview);
      utterance.lang = "id-ID";

      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith("id") || v.lang.startsWith("in"));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Logika Menggambar Canvas Share Card
  const generateCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !movie) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, 1080, 1920);

    const backdropUrl = movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
      : "/default-backdrop.png";
    const posterUrlPath = posterUrl(movie.poster_path) || "/default-poster.png";

    // 1. Load Background Blur
    const bgImg = new window.Image();
    bgImg.crossOrigin = "anonymous";
    bgImg.src = backdropUrl;
    bgImg.onload = () => {
      ctx.save();
      ctx.filter = "blur(40px)";
      ctx.drawImage(bgImg, -100, -100, 1280, 2120);
      ctx.restore();

      ctx.fillStyle = "rgba(10, 10, 15, 0.78)";
      ctx.fillRect(0, 0, 1080, 1920);

      // Border hiasan
      ctx.strokeStyle = "rgba(147, 51, 234, 0.35)";
      ctx.lineWidth = 16;
      ctx.strokeRect(40, 40, 1000, 1840);

      // 2. Load Poster Film
      const posterImg = new window.Image();
      posterImg.crossOrigin = "anonymous";
      posterImg.src = posterUrlPath;
      posterImg.onload = () => {
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 15;
        ctx.shadowOffsetX = 0;

        const pWidth = 480;
        const pHeight = 720;
        const pX = (1080 - pWidth) / 2;
        const pY = 180;
        ctx.drawImage(posterImg, pX, pY, pWidth, pHeight);

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 3. Info Judul & Rincian
        ctx.fillStyle = "#FDFBF7";
        ctx.textAlign = "center";
        ctx.font = "900 60px Outfit, sans-serif";
        const titleY = 1000;
        wrapText(ctx, movie.title.toUpperCase(), 540, titleY, 850, 75);

        ctx.fillStyle = "#8E7F98";
        ctx.font = "600 32px Inter, sans-serif";
        const details = `${year(movie.release_date)} · ${movie.genres.map((g) => g.name).slice(0, 3).join(", ")}`;
        ctx.fillText(details, 540, 1160);

        // 4. Rating Personal
        const userRating = watchItem?.userRating || 0;
        if (userRating > 0) {
          ctx.fillStyle = "#F59E0B";
          ctx.font = "64px Inter, sans-serif";
          let stars = "";
          for (let i = 1; i <= 10; i++) {
            stars += i <= userRating ? "★" : "☆";
          }
          ctx.fillText(stars, 540, 1260);

          ctx.fillStyle = "#FDFBF7";
          ctx.font = "900 44px Outfit, sans-serif";
          ctx.fillText(`REVIEW SAYA: ${userRating}/10`, 540, 1340);
        } else {
          ctx.fillStyle = "#A78BFA";
          ctx.font = "bold italic 36px Inter, sans-serif";
          ctx.fillText("DISIMPAN DI WATCHLIST CINEVAULT", 540, 1280);
        }

        // 5. Catatan / Ulasan Review
        if (watchItem?.note) {
          ctx.fillStyle = "#FFF5EA";
          ctx.font = "italic 32px Inter, sans-serif";
          wrapText(ctx, `"${watchItem.note}"`, 540, 1440, 780, 48);
        }

        // 6. Watermark footer
        ctx.fillStyle = "rgba(147, 51, 234, 0.75)";
        ctx.font = "900 36px Outfit, sans-serif";
        ctx.fillText("🎬 CINEVAULT by Aliakbar", 540, 1720);

        ctx.fillStyle = "rgba(147, 51, 234, 0.4)";
        ctx.font = "500 24px Inter, sans-serif";
        ctx.fillText("cinevault-watchlist.app", 540, 1770);

        setCanvasReady(true);
      };
      posterImg.onerror = () => setCanvasReady(true);
    };
    bgImg.onerror = () => setCanvasReady(true);
  };

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${movie?.title.replace(/\s+/g, "_")}_CineVaultCard.png`;
    link.href = url;
    link.click();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([20, 40, 20]);
    }
  };

  if (loading) return (
    <div className="min-h-screen">
      <div className="h-[50vh] shimmer" />
      <DetailSkeleton />
    </div>
  );
  if (!movie) return (
    <div className="flex min-h-screen items-center justify-center text-muted">Film tidak ditemukan</div>
  );

  const backdrop = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const poster = posterUrl(movie.poster_path, "w500");

  const isUpcoming = movie.status === "Upcoming" || 
    (movie.release_date && new Date(movie.release_date) > new Date());

  return (
    <div className="min-h-screen pb-20">
      {/* ─── BACKDROP HERO ─── */}
      <div className="relative h-[55vh] md:h-[70vh] overflow-hidden">
        {backdrop && (
          <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image src={backdrop} alt={movie.title} fill priority sizes="100vw" className="object-cover" />
          </motion.div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/80 via-transparent to-transparent" />

        {/* Play trailer button */}
        {trailerVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTrailer(trailerVideo.key)}
              className="flex h-18 w-18 items-center justify-center rounded-full bg-white/15 border-2 border-white/30 backdrop-blur-sm text-white text-3xl shadow-2xl hover:bg-white/25 transition-all"
              style={{ height: 72, width: 72 }}
            >
              ▶
            </motion.button>
          </div>
        )}
      </div>

      {/* ─── KONTEN ─── */}
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex gap-8 -mt-24 relative z-10">
          {/* Poster */}
          {poster && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:block flex-shrink-0"
            >
              <Image
                src={poster}
                alt={movie.title}
                width={220}
                height={330}
                className="rounded-2xl shadow-poster border border-white/10"
              />
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex-1 pt-28 md:pt-2"
          >
            {movie.tagline && (
              <p className="mb-2 text-sm italic text-purple-light">"{movie.tagline}"</p>
            )}
            <h1 className="font-display text-3xl font-black text-text leading-tight md:text-5xl">
              {movie.title}
            </h1>
            {movie.original_title !== movie.title && (
              <p className="mt-1 text-sm text-muted">{movie.original_title}</p>
            )}

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-gold/20 border border-gold/30 px-3 py-1">
                <span className="text-gold">★</span>
                <span className="font-bold text-gold">{rating(movie.vote_average)}</span>
                <span className="text-gold/60 text-xs">({movie.vote_count.toLocaleString()})</span>
              </div>
              <span className="text-soft text-sm">{year(movie.release_date)}</span>
              {movie.runtime > 0 && (
                <span className="text-soft text-sm">⏱ {runtime(movie.runtime)}</span>
              )}
              {movie.genres.map((g) => (
                <Link
                  key={g.id}
                  href={`/genre/${g.id}`}
                  className="rounded-full glass border border-white/10 px-3 py-1 text-xs text-soft hover:text-text hover:border-purple/40 transition-all"
                >
                  {g.name}
                </Link>
              ))}
            </div>

            {/* Sinopsis Heading with voice option */}
            <div className="mt-6 flex items-center gap-3">
              <h2 className="font-display text-lg font-bold text-text">Sinopsis</h2>
              {movie.overview && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleSpeech}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all ${
                    isSpeaking 
                      ? "bg-purple text-white border-purple animate-pulse shadow-cinema-sm" 
                      : "bg-card border-border text-muted hover:text-text"
                  }`}
                  title={isSpeaking ? "Matikan Suara" : "Dengarkan Sinopsis"}
                >
                  {isSpeaking ? "🔊" : "🔈"}
                </motion.button>
              )}
            </div>

            {/* Sinopsis */}
            <p className="mt-2 text-sm leading-relaxed text-soft md:text-base max-w-2xl">
              {movie.overview || "Sinopsis tidak tersedia."}
            </p>

            {/* Actions (Watchlist, Reminder & Share Card) */}
            <div className="mt-6 flex flex-wrap gap-3">
              {isUpcoming && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleToggleReminder}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 font-display font-semibold transition-all shadow-cinema-sm
                  ${hasReminder 
                    ? "bg-amber-600 text-white border border-amber-600" 
                    : "glass border border-gold/30 text-gold hover:bg-gold/10"}`}
                >
                  {hasReminder ? "🔕 Hapus Pengingat" : "🔔 Ingatkan Rilis"}
                </motion.button>
              )}

              {trailerVideo && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTrailer(trailerVideo.key)}
                  className="inline-flex items-center gap-2 rounded-xl bg-cinema px-5 py-3 font-display font-semibold text-white shadow-cinema"
                >
                  ▶ Tonton Trailer
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-2 rounded-xl glass border border-purple/30 text-purple-light hover:bg-purple/10 px-5 py-3 font-display font-semibold transition-all shadow-cinema-sm"
              >
                📸 Bagikan Review
              </motion.button>

              {!watchItem ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleWatchlist("want")}
                  className="inline-flex items-center gap-2 rounded-xl glass border border-white/10 px-5 py-3 font-display font-semibold text-text hover:bg-purple/10 transition-all"
                >
                  🔖 Tambah Watchlist
                </motion.button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => handleWatchlist(s.key)}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all
                      ${watchItem.status === s.key ? `${s.color} text-white shadow-cinema-sm` : "glass border border-white/10 text-text hover:bg-purple/10"}`}
                    >
                      {s.icon} {s.label}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setSelectedRating(watchItem.userRating || 0);
                      setShowRating(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl glass border border-gold/30 px-4 py-2.5 text-sm font-semibold text-gold hover:bg-gold/10 transition-all"
                  >
                    ★ {watchItem.userRating ? `${watchItem.userRating}/10` : "Beri Rating"}
                  </button>
                  <button
                    onClick={handleRemove}
                    className="rounded-xl glass border border-red-500/30 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    ✕ Hapus
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ─── RATING MODAL ─── */}
        <AnimatePresence>
          {showRating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setShowRating(false)}
            >
              <motion.div
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.85 }}
                className="card p-8 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-xl font-bold text-text mb-2">Beri Rating & Ulasan</h3>
                <p className="text-sm text-muted mb-4">{movie.title}</p>
                
                <RatingStars
                  value={selectedRating}
                  onChange={(val) => setSelectedRating(val)}
                />
                
                {/* Input catatan ulasan */}
                <div className="mt-4">
                  <label className="text-xs text-muted mb-1.5 block">Ulasan Singkat (Tampil di Gambar Bagikan)</label>
                  <textarea
                    placeholder="Tulis ulasan menarik kamu tentang film ini..."
                    id="user-note-input"
                    defaultValue={watchItem?.note || ""}
                    className="w-full rounded-xl bg-surface border border-border px-3 py-2.5 text-text text-sm outline-none focus:border-purple/60 placeholder:text-muted h-24 resize-none"
                  />
                </div>

                <div className="mt-6 flex items-center justify-end gap-2 text-sm font-semibold">
                  <button onClick={() => setShowRating(false)} className="text-muted hover:text-text px-3 py-2">
                    Batal
                  </button>
                  <button 
                    onClick={() => {
                      const el = document.getElementById("user-note-input") as HTMLTextAreaElement;
                      handleRatingSave(el?.value || "");
                    }} 
                    className="rounded-xl bg-cinema px-5 py-2.5 text-white shadow-cinema hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                  >
                    Simpan Ulasan
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CANVAS SHARE CARD MODAL ─── */}
        <AnimatePresence>
          {showShareModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.85 }}
                className="card p-6 w-full max-w-sm flex flex-col items-center"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-display text-lg font-bold text-text mb-4 text-center">📸 Bagikan Ulasan Estetik</h3>
                
                {/* Container Canvas */}
                <div className="relative w-full aspect-[9/16] bg-card rounded-2xl overflow-hidden border border-border flex items-center justify-center max-w-[280px]">
                  {!canvasReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface p-4 text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple border-t-transparent" />
                      <p className="text-xs text-muted">Mempersiapkan gambar estetik...</p>
                    </div>
                  )}
                  <canvas 
                    ref={canvasRef} 
                    width={1080} 
                    height={1920} 
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="mt-6 flex gap-2 w-full">
                  <button 
                    onClick={() => setShowShareModal(false)} 
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-muted hover:text-text transition-all"
                  >
                    Tutup
                  </button>
                  <button 
                    onClick={downloadCard}
                    disabled={!canvasReady}
                    className="flex-1 rounded-xl bg-cinema py-2.5 text-sm font-semibold text-white shadow-cinema hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] disabled:opacity-50 transition-all"
                  >
                    Unduh PNG 📥
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── CAST ─── */}
        {cast.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <h2 className="mb-4 font-display text-xl font-bold text-text">🎭 Pemeran</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-3">
              {cast.map((actor, i) => (
                <motion.div
                  key={actor.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="flex-shrink-0 w-24 text-center"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-full bg-card mb-2 border-2 border-border">
                    {actor.profile_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl">👤</div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-text line-clamp-2">{actor.name}</p>
                  <p className="text-[10px] text-muted mt-0.5 line-clamp-1">{actor.character}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ─── INFO TAMBAHAN ─── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <h2 className="mb-4 font-display text-xl font-bold text-text">ℹ Info Film</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {[
              { label: "Status", value: movie.status },
              { label: "Rilis", value: movie.release_date || "—" },
              { label: "Durasi", value: movie.runtime ? runtime(movie.runtime) : "—" },
              { label: "Rating TMDB", value: `${rating(movie.vote_average)}/10` },
              { label: "Bahasa", value: movie.spoken_languages?.[0]?.english_name ?? "—" },
              { label: "Negara", value: movie.production_countries?.[0]?.name ?? "—" },
              { label: "Budget", value: movie.budget > 0 ? `$${(movie.budget / 1e6).toFixed(0)}M` : "—" },
              { label: "Pendapatan", value: movie.revenue > 0 ? `$${(movie.revenue / 1e6).toFixed(0)}M` : "—" },
            ].map((item) => (
              <div key={item.label} className="card p-3">
                <p className="text-xs text-muted">{item.label}</p>
                <p className="mt-1 text-sm font-semibold text-text">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ─── FILM SERUPA ─── */}
        {similar.length > 0 && (
          <div className="mt-12">
            <MovieRow movies={similar} title="🎬 Film Serupa" />
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {trailer && <TrailerModal videoKey={trailer} onClose={() => setTrailer(null)} />}
    </div>
  );
}
