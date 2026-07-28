"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { posterUrl, year, rating, type Movie } from "@/lib/api";
import { getWatchlistItem, addToWatchlist, removeFromWatchlist } from "@/lib/db";

function StarRating({ score }: { score: number | undefined | null }) {
  const safeScore = score ?? 0;
  const stars = Math.round(safeScore / 2);
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={`text-[10px] ${s <= stars ? "text-gold" : "text-border"}`}>★</span>
      ))}
      <span className="text-xs text-muted ml-1">{rating(safeScore)}</span>
    </div>
  );
}

export default function MovieCard({ movie, index = 0 }: { movie: Movie; index?: number }) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const [imgError, setImgError] = useState(false);
  const poster = posterUrl(movie.poster_path);

  useEffect(() => {
    getWatchlistItem(movie.id).then((item) => setInWatchlist(!!item));
  }, [movie.id]);

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      await removeFromWatchlist(movie.id);
      setInWatchlist(false);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
    } else {
      await addToWatchlist({
        id: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        releaseDate: movie.release_date,
        voteAverage: movie.vote_average ?? 0,
        overview: movie.overview,
        status: "want",
      });
      setInWatchlist(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(15);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      <Link href={`/movie/${movie.id}`} className="block">
        {/* Poster */}
        <div className="relative overflow-hidden rounded-xl aspect-[2/3] bg-card shadow-poster">
          {poster && !imgError ? (
            <Image
              src={poster}
              alt={movie.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-card text-4xl">🎬</div>
          )}

          {/* Overlay gradient & Play Button */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple/90 border border-purple-light/50 text-white text-lg shadow-[0_0_25px_rgba(147,51,234,0.7)] transform scale-75 group-hover:scale-100 transition-transform">
              ▶
            </div>
            <span className="text-[10px] font-bold text-white bg-purple/80 px-2.5 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
              Nonton HD
            </span>
          </div>

          {/* Rating badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full glass px-2 py-1">
            <span className="text-gold text-xs">★</span>
            <span className="text-xs font-bold text-white">{rating(movie.vote_average)}</span>
          </div>

          {/* Watchlist btn */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={toggleWatchlist}
            className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full transition-all
            ${inWatchlist
              ? "bg-purple text-white shadow-cinema-sm"
              : "glass text-muted opacity-0 group-hover:opacity-100"
            }`}
          >
            <span className="text-sm">{inWatchlist ? "✓" : "+"}</span>
          </motion.button>

          {/* Year badge bottom */}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="rounded-lg glass px-2 py-0.5 text-xs text-soft">{year(movie.release_date)}</span>
          </div>
        </div>

        {/* Info */}
        <div className="mt-2.5 px-0.5">
          <h3 className="font-display font-semibold text-sm text-text line-clamp-2 leading-tight group-hover:text-purple-light transition-colors">
            {movie.title}
          </h3>
          <div className="mt-1.5">
            <StarRating score={movie.vote_average} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
