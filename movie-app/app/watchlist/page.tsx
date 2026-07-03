"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllWatchlist, getWatchlistStats, removeFromWatchlist, updateStatus,
  type WatchlistItem, type WatchStatus,
} from "@/lib/db";
import { posterUrl, year, rating } from "@/lib/api";

const STATUS_TABS: { key: WatchStatus | "all"; label: string; icon: string }[] = [
  { key: "all", label: "Semua", icon: "🎬" },
  { key: "want", label: "Mau Nonton", icon: "🔖" },
  { key: "watching", label: "Sedang Nonton", icon: "▶" },
  { key: "done", label: "Sudah Nonton", icon: "✓" },
];

interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: string;
}

function WatchCard({ item, onRemove, onStatus }: {
  item: WatchlistItem;
  onRemove: (id: number) => void;
  onStatus: (id: number, s: WatchStatus) => void;
}) {
  const poster = posterUrl(item.posterPath);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="card overflow-hidden group"
    >
      <Link href={`/movie/${item.id}`} className="flex gap-3 p-3">
        {/* Poster */}
        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-card">
          {poster ? (
            <Image src={poster} alt={item.title} fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">🎬</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-text text-sm leading-tight line-clamp-2">
            {item.title}
          </h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-gold text-xs">★</span>
            <span className="text-xs text-soft">{rating(item.voteAverage)}</span>
            <span className="text-border">·</span>
            <span className="text-xs text-muted">{year(item.releaseDate)}</span>
          </div>
          {item.userRating && (
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-gold text-xs">★</span>
              <span className="text-xs font-bold text-gold">Rating kamu: {item.userRating}/10</span>
            </div>
          )}
          {item.note && (
            <p className="mt-1 text-[11px] text-purple-light italic line-clamp-1">"{item.note}"</p>
          )}
          <p className="mt-1.5 text-[11px] text-muted line-clamp-2">{item.overview}</p>
        </div>
      </Link>

      {/* Actions */}
      <div className="border-t border-border px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {(["want", "watching", "done"] as WatchStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatus(item.id, s)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors
              ${item.status === s
                ? s === "want" ? "bg-blue-600 text-white"
                : s === "watching" ? "bg-orange-500 text-white"
                : "bg-green-600 text-white"
                : "text-muted hover:text-text bg-surface"
              }`}
            >
              {s === "want" ? "🔖" : s === "watching" ? "▶" : "✓"}
            </button>
          ))}
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="rounded-lg px-2.5 py-1 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Hapus
        </button>
      </div>
    </motion.div>
  );
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [tab, setTab] = useState<WatchStatus | "all">("all");
  const [stats, setStats] = useState({ total: 0, want: 0, watching: 0, done: 0, avgRating: 0 });
  const [sort, setSort] = useState<"addedAt" | "title" | "rating">("addedAt");
  const [showAchievements, setShowAchievements] = useState(false);

  const load = async () => {
    const all = await getAllWatchlist();
    setItems(all);
    getWatchlistStats().then(setStats);
  };

  useEffect(() => { load(); }, []);

  const filtered = items
    .filter((i) => tab === "all" || i.status === tab)
    .sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "rating") return (b.userRating ?? 0) - (a.userRating ?? 0);
      return b.addedAt - a.addedAt;
    });

  const handleRemove = async (id: number) => {
    await removeFromWatchlist(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    getWatchlistStats().then(setStats);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  const handleStatus = async (id: number, status: WatchStatus) => {
    await updateStatus(id, status);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
    getWatchlistStats().then(setStats);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (status === "done") {
        navigator.vibrate([20, 50, 20]);
      } else {
        navigator.vibrate(15);
      }
    }
  };

  // Logika Menghitung Pencapaian (Achievements)
  const actionKeywords = ["aksi", "laga", "petualangan", "perang", "kejar", "tembak", "adrenalin", "thriller", "action", "adventure"];
  const sciFiKeywords = ["sains", "fiksi ilmiah", "misteri", "teka-teki", "puzzle", "waktu", "angkasa", "sci-fi", "science fiction", "mystery"];

  const hasAny = items.length >= 1;
  const hasRating = items.some((i) => i.userRating && i.userRating > 0);
  const doneCount = items.filter((i) => i.status === "done").length;
  const adrenalineCount = items.filter(
    (i) => i.status === "done" && actionKeywords.some((kw) => i.overview?.toLowerCase().includes(kw) || i.title?.toLowerCase().includes(kw))
  ).length;
  const scifiCount = items.filter(
    (i) => i.status === "done" && sciFiKeywords.some((kw) => i.overview?.toLowerCase().includes(kw) || i.title?.toLowerCase().includes(kw))
  ).length;

  const achievements: Achievement[] = [
    {
      id: "starter",
      title: "Penonton Pemula",
      description: "Menambahkan film pertama ke watchlist.",
      emoji: "🍿",
      unlocked: hasAny,
      progress: hasAny ? "1/1" : "0/1",
    },
    {
      id: "critic",
      title: "Kritikus Perdana",
      description: "Beri rating & ulasan film pertamamu.",
      emoji: "✍️",
      unlocked: hasRating,
      progress: hasRating ? "1/1" : "0/1",
    },
    {
      id: "marathon",
      title: "Marathon Runner",
      description: "Menyelesaikan 5 judul film.",
      emoji: "🎯",
      unlocked: doneCount >= 5,
      progress: `${Math.min(doneCount, 5)}/5`,
    },
    {
      id: "adrenaline",
      title: "Adrenaline Junkie",
      description: "Menonton 3 film Aksi/Adventure/Thriller.",
      emoji: "⚡",
      unlocked: adrenalineCount >= 3,
      progress: `${Math.min(adrenalineCount, 3)}/3`,
    },
    {
      id: "thinker",
      title: "Pemikir Ulung",
      description: "Menonton 3 film Sci-Fi/Misteri.",
      emoji: "🧩",
      unlocked: scifiCount >= 3,
      progress: `${Math.min(scifiCount, 3)}/3`,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="font-display text-3xl font-black text-text md:text-4xl">🎬 Watchlist Saya</h1>
          
          {/* Toggle Achievements */}
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="flex items-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm text-soft hover:text-text hover:border-purple/50 transition-all w-max"
          >
            <span>🏆</span>
            <span>Lencana Prestasi</span>
            <span className="rounded-full bg-purple/10 px-2 py-0.5 text-xs text-purple-light font-bold">
              {unlockedCount}/{achievements.length}
            </span>
          </button>
        </div>

        {/* Panel Achievements (Collapse/Expand) */}
        <AnimatePresence>
          {showAchievements && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-surface rounded-2xl border border-border">
                {achievements.map((ach) => (
                  <motion.div
                    key={ach.id}
                    whileHover={ach.unlocked ? { scale: 1.03 } : {}}
                    className={`card p-4 text-center flex flex-col justify-between relative overflow-hidden transition-all
                    ${ach.unlocked 
                      ? "border-gold/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] bg-gradient-to-b from-card to-gold/5" 
                      : "opacity-45 border-border bg-card"
                    }`}
                  >
                    <div>
                      <div className="text-3xl mb-2 flex justify-center items-center gap-1.5">
                        <span>{ach.emoji}</span>
                        {!ach.unlocked && <span className="text-base text-muted">🔒</span>}
                      </div>
                      <h4 className={`font-display font-bold text-sm ${ach.unlocked ? "text-gradient font-black" : "text-text"}`}>
                        {ach.title}
                      </h4>
                      <p className="text-[11px] text-muted mt-1 leading-tight">{ach.description}</p>
                    </div>
                    
                    <div className="mt-3">
                      <span className={`text-[10px] font-bold rounded px-2 py-0.5 ${
                        ach.unlocked ? "bg-gold/15 text-gold" : "bg-surface text-muted"
                      }`}>
                        {ach.progress}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        {stats.total > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Total Film", value: stats.total, icon: "🎬" },
              { label: "Mau Nonton", value: stats.want, icon: "🔖" },
              { label: "Sedang Nonton", value: stats.watching, icon: "▶" },
              { label: "Sudah Nonton", value: stats.done, icon: "✓" },
            ].map((s) => (
              <motion.div
                key={s.label}
                whileHover={{ scale: 1.02 }}
                className="card p-4 text-center"
              >
                <p className="text-2xl">{s.icon}</p>
                <p className="mt-1 font-display text-2xl font-bold text-text">{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all
              ${tab === t.key ? "bg-cinema text-white shadow-cinema" : "glass border border-white/5 text-muted hover:text-text"}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="ml-auto flex-shrink-0 rounded-xl glass border border-white/5 px-3 py-2 text-sm text-soft bg-transparent outline-none"
          >
            <option value="addedAt">Terbaru</option>
            <option value="title">A–Z</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </motion.div>

      {/* List */}
      <div className="mt-5">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 text-center"
          >
            <p className="text-6xl mb-4">🍿</p>
            <p className="font-display text-2xl font-bold text-text">Watchlist masih kosong</p>
            <p className="mt-2 text-muted">Tambahkan film yang mau kamu tonton</p>
            <Link
              href="/search"
              className="mt-6 inline-block rounded-xl bg-cinema px-6 py-3 font-display font-semibold text-white shadow-cinema"
            >
              🔍 Cari Film Sekarang
            </Link>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((item) => (
                <WatchCard
                  key={item.id}
                  item={item}
                  onRemove={handleRemove}
                  onStatus={handleStatus}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
