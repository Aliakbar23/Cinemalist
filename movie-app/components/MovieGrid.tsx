import MovieCard from "./MovieCard";
import type { Movie } from "@/lib/api";

export default function MovieGrid({ movies, title }: { movies: Movie[]; title?: string }) {
  return (
    <section>
      {title && (
        <h2 className="mb-5 font-display text-xl font-bold text-text md:text-2xl">{title}</h2>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((m, i) => (
          <MovieCard key={m.id} movie={m} index={i} />
        ))}
      </div>
    </section>
  );
}
