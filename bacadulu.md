# 🎬 CineVault — Movie Watchlist PWA (BACA DULU)

Dokumen ini berfungsi sebagai panduan utama bagi AI/Developer untuk memahami proyek **CineVault** tanpa harus membaca seluruh kode dari awal. Setiap kali ada pembaruan besar pada proyek ini, dokumen ini harus diperbarui pada bagian **"Status Proyek & Log Pembaruan"** di bagian bawah.

---

## 🛠️ Stack Teknologi

1. **Framework:** Next.js 14 (App Router + Server Components)
2. **Styling:** Tailwind CSS (Tema Cinematic Dark — Dominasi warna hitam, ungu, dan emas/gold)
3. **Animasi:** Framer Motion (Transisi halaman, hover card, modal trailer, filter watchlist)
4. **Database Lokal (Offline):** Dexie.js (IndexedDB wrapper) untuk menyimpan watchlist, status nonton, rating personal, dan catatan.
5. **API Data:** TMDB (The Movie Database) API v3.
6. **Desain PWA:** Konfigurasi PWA dengan Web Manifest dan Service Worker bawaan Next.js/custom.

---

## 🔑 Konfigurasi & API Key

Aplikasi menggunakan API dari **The Movie Database (TMDB)**. Kredensial telah dikonfigurasi di file:
* File: `movie-app/.env.local`

### Variabel Lingkungan:
* `NEXT_PUBLIC_TMDB_KEY`: API Key v3 yang digunakan untuk otentikasi query parameter (`api_key`).
* `NEXT_PUBLIC_TMDB_ACCESS_TOKEN`: API Read Access Token v4 (disimpan untuk referensi jika di masa depan ingin beralih ke otentikasi header Bearer).

---

## 📁 Struktur Folder Utama

Berikut adalah letak komponen dan logika penting pada direktori `movie-app/`:

```text
movie-app/
├── app/
│   ├── layout.tsx          ← Root layout, Navbar, Font (Outfit & Inter), Metadata
│   ├── page.tsx            ← Beranda (Server Component: Mengambil data trending, now playing, dll.)
│   ├── globals.css         ← Desain global, variabel warna Tailwind, & custom scrollbars
│   ├── search/page.tsx     ← Halaman pencarian film (Debounce 400ms, popular suggestions)
│   ├── watchlist/page.tsx  ← Halaman Watchlist (Client Component: Integrasi Dexie DB & filter/sorting)
│   ├── movie/[id]/page.tsx ← Detail film (Client Component: Trailer modal, watchlist toggle, bintang rating)
│   └── genre/[id]/page.tsx ← Filter film berdasarkan genre
├── components/
│   ├── Navbar.tsx          ← Navbar responsif dengan efek glassmorphism & menu mobile
│   ├── MovieCard.tsx       ← Kartu film dengan hover scale & shortcut status watchlist
│   ├── MovieGrid.tsx       ← Grid responsif untuk daftar film
│   ├── MovieRow.tsx        ← Baris horizontal scrollable untuk kategori film
│   └── Skeletons.tsx       ← Loading skeleton untuk UX yang mulus saat transisi
├── lib/
│   ├── api.ts              ← Integrasi TMDB API (helper fetch data, types, mapper genre)
│   └── db.ts               ← Skema Dexie.js (IndexedDB) dan operasi CRUD database lokal
├── public/
│   └── manifest.json       ← Manifest PWA untuk metadata aplikasi di mobile/desktop
└── .env.local              ← File rahasia berisi API Key TMDB (Aktif)
```

---

## 💾 Skema Database Lokal (Dexie.js)

Database IndexedDB diberi nama `MovieDB` dengan store `watchlist`.
* File Logika: [db.ts](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/lib/db.ts)

### Struktur Item (`WatchlistItem`):
```typescript
interface WatchlistItem {
  id: number;            // ID film unik dari TMDB
  title: string;         // Judul film
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  overview: string;
  status: "want" | "watching" | "done"; // Status: Mau Nonton, Sedang Nonton, Sudah Nonton
  userRating?: number;   // Rating personal dari user (1 - 10)
  note?: string;         // Catatan personal dari user
  addedAt: number;       // Timestamp ditambahkan ke watchlist
  watchedAt?: number;    // Timestamp selesai nonton (jika status === "done")
}
```

---

## 🌐 Integrasi API TMDB

Seluruh fetch data dilakukan melalui fungsi helper terpusat di [api.ts](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/lib/api.ts).
* URL API: `https://api.themoviedb.org/3`
* Bahasa Default: `id-ID` (Bahasa Indonesia untuk judul dan sinopsis jika tersedia).
* Revalidasi Data: Data di-cache oleh Next.js selama 3600 detik (1 jam) untuk optimasi performa.

---

## 📈 Status Proyek & Log Pembaruan

Bagian ini harus selalu diperbarui oleh AI setelah melakukan modifikasi pada kode proyek.

### 📅 3 Juli 2026 (Pembaruan Ketiga)
* **Pembaruan:** Implementasi 5 Fitur Premium PWA (Voice Search, Haptic Feedback, Mood Discovery, TTS Synopsis, & Release Reminders).
* **Tindakan:**
  1. **Voice Search (Pencarian Suara):** Mengintegrasikan Web Speech Recognition API di [search/page.tsx](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/app/search/page.tsx) dengan status tombol mikrofon berdenyut merah saat mendengarkan.
  2. **Haptic Feedback (Getaran Sentuhan):** Menambahkan getaran sentuhan fisik ponsel via Vibration API (`navigator.vibrate`): getar mikro (8ms) saat rating bintang, getar pendek (15ms) saat watchlist toggle, dan getar ganda (20ms-50ms-20ms) saat selesai menonton.
  3. **Mood-Based Discovery (Pencarian Mood):** Membuat pemetaan genre film berdasarkan suasana hati di [api.ts](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/lib/api.ts) dan menambahkan UI pilihan mood di [page.tsx](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/app/page.tsx) terintegrasi otomatis dengan pencarian TMDB discover.
  4. **TTS Synopsis Reader (Pembaca Sinopsis):** Menambahkan tombol 🔊 pembaca sinopsis film berbahasa Indonesia menggunakan SpeechSynthesis API di halaman detail film [movie/[id]/page.tsx](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/app/movie/[id]/page.tsx).
  5. **Release Reminders (Pengingat Rilis):** Membuat service worker [sw.js](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/public/sw.js) dan lencana lonceng 🔔 pada halaman detail film upcoming. Data disimpan di Dexie IndexedDB versi 2 [db.ts](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/lib/db.ts) dan memicu notifikasi lokal otomatis saat mendeteksi film rilis saat app dijalankan.
  6. **Pencegahan Sinopsis Kosong (English Fallback):** Menambahkan logika fallback di [api.ts](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/lib/api.ts) agar otomatis mengunduh sinopsis bahasa Inggris (`en-US`) jika sinopsis bahasa Indonesia (`id-ID`) kosong. Latar Hero Beranda di [page.tsx](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/app/page.tsx) juga ditingkatkan dengan memanggil API detail film agar sinopsis banner utama terisi sempurna.
  7. **Konfigurasi CineBot AI Key:** Menambahkan kunci API Gemini (`NEXT_PUBLIC_GEMINI_KEY`) di berkas [.env.local](file:///c:/Users/user/Downloads/cinevault-pwa/movie-app/.env.local) dan mengarahkan target API ke model stabil terbaru `gemini-2.5-flash` (karena API Google terbaru di 2026 menolak model 1.5). CineBot AI Chatbot langsung aktif dan dapat langsung digunakan secara bawaan.
* **Status:** Seluruh 5 fitur cerdas PWA + pencegahan sinopsis kosong + CineBot AI Key sukses dikonfigurasi penuh dengan model Gemini 2.5 Flash terbaru.

### 📅 3 Juli 2026 (Pembaruan Kedua)
* **Pembaruan:** Fitur Playful Light Mode (Tema Terang yang Ceria).
* **Tindakan:**
  1. **Konfigurasi CSS & Tailwind:** Mengubah `tailwind.config.js` untuk memetakan warna, gradien background, dan bayangan ke variabel CSS (`var(--...)`).
  2. **Definisi Tema Baru:** Menambahkan variabel CSS untuk tema gelap (default) dan tema terang ceria (kelas `.light`) di `globals.css` dengan transisi warna mulus.
  3. **Penyesuaian Teks Dinamis:** Mengganti kelas-kelas statis `text-white` pada judul, deskripsi, label, dan header halaman menjadi `text-text` agar secara otomatis menyesuaikan kontras warna saat tema berganti.
  4. **Pencegahan Hydration Flicker:** Menyisipkan script IIFE pemblokir di tag `<head>` pada `layout.tsx` untuk membaca preferensi tema dari `localStorage` sebelum halaman melakukan render visual awal.
  5. **Implementasi Toggle UI:** Membuat tombol toggle interaktif (ikon 🎨/🌙) dengan animasi rotasi/scale menggunakan Framer Motion pada desktop dan mobile menu di `Navbar.tsx`.
* **Status:** Fitur Light Mode selesai diimplementasikan dan diverifikasi sukses.

### 📅 3 Juli 2026 (Pembaruan Pertama)
* **Pembaruan:** Inisialisasi konfigurasi API Key TMDB.
* **Tindakan:**
  1. Membuat file `movie-app/.env.local` berisi API Key TMDB (`13ceb71f40890f4d165ea612f7c2464b`) dan API Read Access Token.
  2. Membuat dokumen panduan awal `bacadulu.md` agar AI dapat langsung memahami arsitektur proyek di masa depan secara instan.
* **Status:** Aplikasi siap dijalankan secara lokal (`npm run dev`).
