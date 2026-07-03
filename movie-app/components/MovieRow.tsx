"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { posterUrl, year, rating, type Movie } from "@/lib/api";

export default function MovieRow({
  movies,
  title,
  seeAllHref,
}: {
  movies: Movie[];
  title: string;
  seeAllHref?: string;
}) {
  return (
    <section className="overflow-hidden">
      <div className="mb-4 flex items-center justify-between px-4 md:px-8">
        <motion.h2
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="font-display text-xl font-bold text-text md:text-2xl"
        >
          {title}
        </motion.h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-sm text-purple-light hover:text-purple transition-colors">
            Lihat Semua →
          </Link>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-4 md:px-8">
        {movies.map((movie, i) => (
          <motion.div
            key={movie.id}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.04, duration: 0.4 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="group flex-shrink-0"
            style={{ width: "clamp(120px, 30vw, 160px)" }}
          >
            <Link href={`/movie/${movie.id}`} className="block">
              <div className="relative overflow-hidden rounded-xl shadow-poster"
                style={{ aspectRatio: "2/3" }}>
                {posterUrl(movie.poster_path) ? (
                  <Image
                    src={posterUrl(movie.poster_path)!}
                    alt={movie.title}
                    fill
                    sizes="160px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card text-3xl">🎬</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <span className="text-gold text-xs">★</span>
                  <span className="text-xs font-bold text-white">{rating(movie.vote_average)}</span>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-xs font-semibold text-text line-clamp-2 group-hover:text-purple-light transition-colors">
                  {movie.title}
                </p>
                <p className="mt-0.5 text-[10px] text-muted">{year(movie.release_date)}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
