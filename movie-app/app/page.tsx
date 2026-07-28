import Image from "next/image";
import Link from "next/link";
import { getTrending, getNowPlaying, getTopRated, getUpcoming, getMovieDetail, posterUrl, year, rating, GENRE_MAP } from "@/lib/api";
import MovieRow from "@/components/MovieRow";

const GENRES = [
  { id: 28, label: "Aksi", emoji: "💥" },
  { id: 18, label: "Drama", emoji: "🎭" },
  { id: 16, label: "Animasi & Anime", emoji: "🌸" },
  { id: 35, label: "Komedi", emoji: "😂" },
  { id: 27, label: "Horor", emoji: "👻" },
  { id: 10749, label: "Romantis", emoji: "💕" },
  { id: 878, label: "Sci-Fi", emoji: "🚀" },
  { id: 53, label: "Thriller", emoji: "😰" },
];

export default async function HomePage() {
  const [trending, nowPlaying, topRated, upcoming] = await Promise.all([
    getTrending(),
    getNowPlaying(),
    getTopRated(),
    getUpcoming(),
  ]);

  const heroItem = trending.results?.[0] ?? null;
  let hero = heroItem;
  if (heroItem) {
    try {
      const detail = await getMovieDetail(heroItem.id);
      hero = { ...heroItem, ...detail };
    } catch (e) {
      console.error("Failed to fetch hero movie details:", e);
    }
  }
  if (!hero) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        Memuat film trending...
      </div>
    );
  }
  const heroBackdrop = hero.backdrop_path
    ? `https://image.tmdb.org/t/p/original${hero.backdrop_path}`
    : null;
  const heroPoster = posterUrl(hero.poster_path, "w500");

  return (
    <div className="min-h-screen">
      {/* ─── HERO ─── */}
      <section className="relative min-h-[85vh] flex items-end overflow-hidden">
        {/* Backdrop */}
        {heroBackdrop && (
          <div className="absolute inset-0">
            <Image
              src={heroBackdrop}
              alt={hero.title}
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-hero-overlay" />
            <div className="absolute inset-0 bg-hero-bottom" />
            {/* Vignette kanan */}
            <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent" />
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pb-16 md:px-8 flex flex-col md:flex-row items-end md:items-center gap-8">
          {/* Poster kecil di mobile hidden, muncul di md */}
          {heroPoster && (
            <div className="hidden md:block flex-shrink-0">
              <Image
                src={heroPoster}
                alt={hero.title}
                width={200}
                height={300}
                className="rounded-2xl shadow-poster"
              />
            </div>
          )}

          <div className="flex-1 max-w-2xl">
            {/* Badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full glass px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-text">Trending #1 Minggu Ini</span>
            </div>

            <h1 className="font-display text-4xl font-black text-text leading-tight md:text-6xl">
              {hero.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-gold text-lg">★</span>
                <span className="font-bold text-text">{rating(hero.vote_average)}</span>
                <span className="text-muted text-sm">/10</span>
              </div>
              <span className="text-border">·</span>
              <span className="text-soft text-sm">{year(hero.release_date)}</span>
              {hero.genre_ids?.slice(0, 3).map((gid) => (
                <span key={gid} className="rounded-full glass px-2.5 py-0.5 text-xs text-soft">
                  {GENRE_MAP[gid] ?? ""}
                </span>
              ))}
            </div>

            <p className="mt-4 text-sm text-soft leading-relaxed line-clamp-3 md:text-base md:line-clamp-4">
              {hero.overview || "Tidak ada sinopsis tersedia."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/movie/${hero.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-cinema px-5 py-3 font-display font-semibold text-white shadow-cinema hover:shadow-cinema transition-all hover:-translate-y-0.5"
              >
                <span>▶</span> Lihat Detail
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-xl glass border border-white/10 px-5 py-3 font-display font-semibold text-text hover:bg-purple/10 transition-all"
              >
                🔍 Cari Film
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MOOD FILTER ─── */}
      <section className="px-4 pt-8 md:px-8">
        <h2 className="mb-4 font-display text-xl font-bold text-text md:text-2xl">
          🎭 Bagaimana suasana hatimu hari ini?
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {[
            { id: "mikir", label: "Butuh Mikir Keras", emoji: "🧩", color: "from-purple/20 to-purple/5 border-purple/30 text-purple-light", href: "/search?mood=mikir" },
            { id: "santai", label: "Teman Bersantai", emoji: "🍿", color: "from-green-600/20 to-green-600/5 border-green-600/30 text-green-400", href: "/search?mood=santai" },
            { id: "romantis", label: "Kencan Romantis", emoji: "❤️", color: "from-red-500/20 to-red-500/5 border-red-500/30 text-red-400", href: "/search?mood=romantis" },
            { id: "adrenalin", label: "Pompa Adrenalin", emoji: "⚡", color: "from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-400", href: "/search?mood=adrenalin" },
            { id: "seram", label: "Uji Nyali", emoji: "👻", color: "from-blue-600/20 to-blue-600/5 border-blue-600/30 text-blue-400", href: "/search?mood=seram" },
          ].map((mood) => (
            <Link
              key={mood.id}
              href={mood.href}
              className={`flex flex-col items-center justify-center rounded-2xl border p-5 text-center bg-gradient-to-br ${mood.color} transition-all hover:scale-105 hover:shadow-cinema-sm`}
            >
              <span className="text-3xl mb-2">{mood.emoji}</span>
              <span className="font-display font-bold text-sm text-text">{mood.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── GENRE PILLS ─── */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 py-6 md:px-8">
        {GENRES.map((g) => (
          <Link
            key={g.id}
            href={`/genre/${g.id}`}
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-full glass border border-white/5 px-4 py-2 text-sm font-medium text-soft hover:text-text hover:border-purple/40 transition-all hover:-translate-y-0.5"
          >
            <span>{g.emoji}</span> {g.label}
          </Link>
        ))}
      </div>

      {/* ─── ROWS ─── */}
      <div className="space-y-10 pb-20">
        <MovieRow
          movies={trending.results.slice(1, 15)}
          title="🔥 Sedang Trending"
          seeAllHref="/search?q=Trending"
        />
        <MovieRow
          movies={nowPlaying.results.slice(0, 14)}
          title="🎥 Tayang Sekarang"
          seeAllHref="/search?q=Now+Playing"
        />
        <MovieRow
          movies={topRated.results.slice(0, 14)}
          title="⭐ Rating Tertinggi"
          seeAllHref="/search?q=Top+Rated"
        />
        <MovieRow
          movies={upcoming.results.slice(0, 14)}
          title="📅 Segera Hadir"
          seeAllHref="/search?q=Upcoming"
        />
      </div>
    </div>
  );
}
