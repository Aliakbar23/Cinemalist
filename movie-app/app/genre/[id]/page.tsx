"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getByGenre, getGenres, type Movie, type Genre } from "@/lib/api";
import MovieGrid from "@/components/MovieGrid";
import { MovieGridSkeleton } from "@/components/Skeletons";

const GENRE_EMOJIS: Record<number, string> = {
  28: "💥", 12: "🗺️", 16: "✨", 35: "😂", 80: "🔫", 99: "📽️",
  18: "🎭", 10751: "👨‍👩‍👧", 14: "🧙", 36: "📜", 27: "👻",
  10402: "🎵", 9648: "🔍", 10749: "💕", 878: "🚀",
  53: "😰", 10752: "⚔️", 37: "🤠",
};

export default function GenrePage() {
  const { id } = useParams<{ id: string }>();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentGenre, setCurrentGenre] = useState<Genre | null>(null);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);

    Promise.all([getByGenre(id, "1"), getGenres()]).then(([data, genreData]) => {
      setMovies(data.results);
      setHasMore(data.total_pages > 1);
      setGenres(genreData.genres);
      setCurrentGenre(genreData.genres.find((g) => g.id === Number(id)) ?? null);
      setLoading(false);
    });
  }, [id]);

  const loadMore = async () => {
    const next = page + 1;
    const data = await getByGenre(id, String(next));
    setMovies((prev) => [...prev, ...data.results]);
    setPage(next);
    setHasMore(next < data.total_pages);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <p className="text-3xl mb-2">{GENRE_EMOJIS[Number(id)] ?? "🎬"}</p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          {currentGenre?.name ?? "Genre"}
        </h1>

        {/* Genre pills */}
        <div className="mt-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {genres.map((g) => (
            <Link
              key={g.id}
              href={`/genre/${g.id}`}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all
              ${g.id === Number(id)
                ? "bg-cinema text-white shadow-cinema"
                : "glass border border-white/5 text-muted hover:text-text"}`}
            >
              {GENRE_EMOJIS[g.id] ?? ""} {g.name}
            </Link>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <MovieGridSkeleton count={18} />
      ) : (
        <>
          <MovieGrid movies={movies} />
          {hasMore && (
            <div className="mt-10 text-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadMore}
                className="rounded-xl bg-cinema px-8 py-3 font-display font-semibold text-white shadow-cinema"
              >
                Muat Lebih Banyak
              </motion.button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
