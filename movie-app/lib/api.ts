// ================================================================
// TMDB API — The Movie Database
// Daftar API key gratis di: https://www.themoviedb.org/settings/api
// Setelah dapat API key, isi di .env.local:
// NEXT_PUBLIC_TMDB_KEY=your_api_key_here
// ================================================================

const BASE = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p";
export const IMG_W500 = `${IMG_BASE}/w500`;
export const IMG_W780 = `${IMG_BASE}/w780`;
export const IMG_ORIGINAL = `${IMG_BASE}/original`;

function getKey() {
  const key = process.env.NEXT_PUBLIC_TMDB_KEY;
  if (!key) throw new Error("TMDB API key tidak ditemukan. Isi NEXT_PUBLIC_TMDB_KEY di .env.local");
  return key;
}

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", getKey());
  url.searchParams.set("language", "id-ID");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

// ---- Types ----

export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  status?: string;
  budget?: number;
  revenue?: number;
}

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface MovieDetail extends Movie {
  genres: Genre[];
  runtime: number;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  production_countries: { name: string }[];
  spoken_languages: { english_name: string }[];
}

export interface PageResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// ---- Endpoints ----

export const getTrending = async () => {
  const data = await tmdb<PageResult<Movie>>("/trending/movie/week");
  return { ...data, results: sanitizeMovies(data.results) };
};

export const getNowPlaying = async () => {
  const data = await tmdb<PageResult<Movie>>("/movie/now_playing");
  return { ...data, results: sanitizeMovies(data.results) };
};

export const getTopRated = async () => {
  const data = await tmdb<PageResult<Movie>>("/movie/top_rated");
  return { ...data, results: sanitizeMovies(data.results) };
};

export const getUpcoming = async () => {
  const data = await tmdb<PageResult<Movie>>("/movie/upcoming");
  return { ...data, results: sanitizeMovies(data.results) };
};

export const getPopular = async () => {
  const data = await tmdb<PageResult<Movie>>("/movie/popular");
  return { ...data, results: sanitizeMovies(data.results) };
};

export const searchMovies = async (query: string, page = "1") => {
  const data = await tmdb<PageResult<Movie>>("/search/movie", { query, page });
  return { ...data, results: sanitizeMovies(data.results) };
};

export const getMovieDetail = async (id: number): Promise<MovieDetail> => {
  const m = await tmdb<MovieDetail>(`/movie/${id}`);
  if (!m.overview || m.overview.trim() === "") {
    try {
      const fallback = await tmdb<MovieDetail>(`/movie/${id}`, { language: "en-US" });
      m.overview = fallback.overview;
      if (!m.tagline && fallback.tagline) {
        m.tagline = fallback.tagline;
      }
    } catch (err) {
      console.error("Failed to fetch English fallback overview:", err);
    }
  }
  return m;
};

export const getMovieCredits = (id: number) =>
  tmdb<{ cast: CastMember[] }>(`/movie/${id}/credits`);

export const getMovieVideos = (id: number) =>
  tmdb<{ results: Video[] }>(`/movie/${id}/videos`);

export const getSimilar = async (id: number) => {
  const data = await tmdb<PageResult<Movie>>(`/movie/${id}/similar`);
  return { ...data, results: sanitizeMovies(data.results) };
};

export const getGenres = () =>
  tmdb<{ genres: Genre[] }>("/genre/movie/list");

export const getByGenre = async (genreId: string, page = "1") => {
  const data = await tmdb<PageResult<Movie>>("/discover/movie", {
    with_genres: genreId,
    sort_by: "popularity.desc",
    page,
  });
  return { ...data, results: sanitizeMovies(data.results) };
};

const MOOD_GENRES: Record<string, string> = {
  mikir: "878,9648,53",    // Sci-Fi, Mystery, Thriller
  santai: "35,10751,16",   // Comedy, Family, Animation
  romantis: "10749,35",    // Romance, Comedy
  adrenalin: "28,12,53",   // Action, Adventure, Thriller
  seram: "27,9648",        // Horror, Mystery
};

export const getMoviesByMood = async (moodId: string, page = "1") => {
  const genres = MOOD_GENRES[moodId] || "";
  const data = await tmdb<PageResult<Movie>>("/discover/movie", {
    with_genres: genres,
    sort_by: "popularity.desc",
    page,
  });
  return { ...data, results: sanitizeMovies(data.results) };
};

// ---- Helpers ----

function sanitizeMovies(movies: Movie[]): Movie[] {
  return movies.filter((m) => m && m.id && m.title);
}

export function posterUrl(path: string | null, size: "w500" | "w780" | "original" = "w500") {
  if (!path) return null;
  return `${IMG_BASE}/${size}${path}`;
}

export function year(date?: string | null) {
  return date ? date.split("-")[0] : "—";
}

export function rating(vote: number | undefined | null) {
  const n = Number(vote);
  return (Number.isFinite(n) ? n : 0).toFixed(1);
}

export function runtime(min?: number | null) {
  const m = min ?? 0;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return h > 0 ? `${h}j ${mins}m` : `${mins}m`;
}

export const GENRE_MAP: Record<number, string> = {
  28: "Aksi", 12: "Petualangan", 16: "Animasi", 35: "Komedi",
  80: "Kejahatan", 99: "Dokumenter", 18: "Drama", 10751: "Keluarga",
  14: "Fantasi", 36: "Sejarah", 27: "Horor", 10402: "Musik",
  9648: "Misteri", 10749: "Romantis", 878: "Fiksi Ilmiah",
  10770: "TV Movie", 53: "Thriller", 10752: "Perang", 37: "Koboi",
};
