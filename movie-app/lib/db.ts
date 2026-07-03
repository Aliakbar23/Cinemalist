import Dexie, { type EntityTable } from "dexie";

export type WatchStatus = "want" | "watching" | "done";

export interface WatchlistItem {
  id: number;            // movie id dari TMDB
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  overview: string;
  status: WatchStatus;
  userRating?: number;   // 1-10 rating dari user
  note?: string;
  addedAt: number;
  watchedAt?: number;
}

export interface MovieReminder {
  id: number;
  title: string;
  releaseDate: string;
  posterPath: string | null;
  scheduledAt: number;
}

const db = new Dexie("MovieDB") as Dexie & {
  watchlist: EntityTable<WatchlistItem, "id">;
  reminders: EntityTable<MovieReminder, "id">;
};

// Naikkan ke versi 2 untuk menambahkan reminders store
db.version(2).stores({
  watchlist: "id, status, addedAt, userRating",
  reminders: "id, releaseDate",
});

export default db;

// ---- Watchlist Helpers ----

export async function addToWatchlist(item: Omit<WatchlistItem, "addedAt">) {
  await db.watchlist.put({ ...item, addedAt: Date.now() });
}

export async function removeFromWatchlist(id: number) {
  await db.watchlist.delete(id);
}

export async function getWatchlistItem(id: number) {
  return db.watchlist.get(id);
}

export async function updateStatus(id: number, status: WatchStatus) {
  await db.watchlist.update(id, {
    status,
    ...(status === "done" ? { watchedAt: Date.now() } : {}),
  });
}

export async function updateRating(id: number, userRating: number, note?: string) {
  await db.watchlist.update(id, { userRating, note });
}

export async function getWatchlistByStatus(status: WatchStatus) {
  return db.watchlist.where("status").equals(status).sortBy("addedAt");
}

export async function getAllWatchlist() {
  return db.watchlist.orderBy("addedAt").reverse().toArray();
}

export async function getWatchlistStats() {
  const all = await db.watchlist.toArray();
  return {
    total: all.length,
    want: all.filter((i) => i.status === "want").length,
    watching: all.filter((i) => i.status === "watching").length,
    done: all.filter((i) => i.status === "done").length,
    avgRating: all.filter((i) => i.userRating).reduce((s, i) => s + (i.userRating ?? 0), 0) /
      (all.filter((i) => i.userRating).length || 1),
  };
}

// ---- Reminders Helpers ----

export async function addReminder(item: Omit<MovieReminder, "scheduledAt">) {
  await db.reminders.put({ ...item, scheduledAt: Date.now() });
}

export async function removeReminder(id: number) {
  await db.reminders.delete(id);
}

export async function getReminder(id: number) {
  return db.reminders.get(id);
}

export async function getAllReminders() {
  return db.reminders.toArray();
}

export async function checkPendingReminders() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const now = new Date();
  const all = await db.reminders.toArray();

  for (const reminder of all) {
    const release = new Date(reminder.releaseDate);
    // Jika tanggal rilis sudah terlewati atau hari ini
    if (now >= release) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification("Film Rilis Hari Ini! 🍿", {
          body: `Film "${reminder.title}" yang kamu tunggu telah tayang!`,
          icon: reminder.posterPath ? `https://image.tmdb.org/t/p/w185${reminder.posterPath}` : "/icon-192.png",
          badge: "/icon-192.png",
          tag: `release-${reminder.id}`,
        });
      } catch (err) {
        // Fallback jika SW belum terhubung
        new Notification("Film Rilis Hari Ini! 🍿", {
          body: `Film "${reminder.title}" yang kamu tunggu telah tayang!`,
          icon: reminder.posterPath ? `https://image.tmdb.org/t/p/w185${reminder.posterPath}` : "/icon-192.png",
        });
      }
      // Hapus reminder yang sudah dikirim agar tidak dikirim ulang
      await db.reminders.delete(reminder.id);
    }
  }
}
