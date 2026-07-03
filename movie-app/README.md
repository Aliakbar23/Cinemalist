# 🎬 CineVault — Movie Watchlist PWA

App movie watchlist full-featured dengan poster, trailer, cast, rating, dan watchlist pribadi. Responsive di semua device — mobile, tablet, laptop, desktop. Animasi penuh dengan Framer Motion.

## Stack
- **Next.js 14** (App Router + Server Components)
- **Tailwind CSS** (cinematic dark theme — hitam, ungu, gold)
- **Framer Motion** (animasi scroll, hover, layout, modal)
- **Dexie.js** (IndexedDB — watchlist tersimpan offline)
- **TMDB API** (poster, backdrop, trailer, cast, genre, search)
- **Google Fonts** — Outfit (display), Inter (body)
- **Next/Image** (optimasi gambar otomatis dari TMDB CDN)

---

## ⚡ Setup Cepat

### 1. Dapatkan TMDB API Key (Gratis, 2 menit)
1. Daftar di https://www.themoviedb.org/signup
2. Login → Settings → API
3. Request API Key → pilih "Developer"
4. Isi form singkat → API key langsung jadi

### 2. Setup project
```bash
# Install
npm install

# Buat file .env.local dari template
cp .env.local.example .env.local

# Edit .env.local, isi API key kamu:
NEXT_PUBLIC_TMDB_KEY=api_key_kamu_disini

# Jalankan
npm run dev
```

Buka http://localhost:3000 — langsung ada film dengan poster!

### 3. Deploy ke Vercel (gratis)
```bash
npm i -g vercel
vercel

# Di dashboard Vercel, tambahkan Environment Variable:
# NEXT_PUBLIC_TMDB_KEY = api_key_kamu
```

---

## Halaman & Fitur

### 🏠 Beranda (`/`)
- Hero section fullscreen dengan backdrop film trending
- Tombol play trailer langsung di hero
- Rating badge, genre tags, tahun rilis
- 4 baris horizontal scroll: Trending, Tayang Sekarang, Rating Tertinggi, Segera Hadir
- Genre pills untuk browse cepat
- Server Component — data di-fetch server side, cepat

### 🔍 Cari Film (`/search`)
- Search real-time dengan debounce 400ms
- Suggestion kata kunci populer
- Grid responsif hasil pencarian
- Total hasil + load more pagination
- Fallback ke film populer saat tidak ada query

### 🎬 Detail Film (`/movie/[id]`)
- Backdrop fullscreen dengan overlay sinematik
- Poster, judul, tagline, rating TMDB + badge gold
- Tombol "Tonton Trailer" → modal YouTube embed
- Tombol tambah ke Watchlist dengan status:
  - 🔖 Mau Nonton
  - ▶ Sedang Nonton
  - ✓ Sudah Nonton
- Beri rating pribadi 1-10 dengan bintang interaktif
- Cast grid dengan foto aktor
- Info film lengkap: durasi, budget, pendapatan, negara, bahasa
- Film serupa horizontal scroll di bawah
- Animasi: backdrop fade-in, konten slide-up, cast stagger

### 📋 Watchlist (`/watchlist`)
- Statistik: total film, mau nonton, sedang nonton, sudah nonton
- Filter tab per status
- Sort by: Terbaru, A-Z, Rating
- Card film dengan poster + aksi cepat ganti status
- Rating pribadi tampil di card
- Animasi layout saat filter/hapus (Framer Motion AnimatePresence)
- Empty state dengan CTA ke search

### 🎭 Genre (`/genre/[id]`)
- Pills semua genre di atas
- Grid film per genre
- Load more pagination
- Emoji per genre

---

## Animasi (Framer Motion)

- **Navbar**: slide dari atas saat pertama load, glass effect saat scroll
- **Mobile menu**: fade + slide per item dengan stagger
- **MovieCard**: fade-up saat masuk viewport, hover naik + scale poster
- **Watchlist card**: layout animation saat filter, exit animation saat hapus
- **Detail backdrop**: scale + fade saat load
- **Trailer modal**: scale spring animation
- **Genre page**: fade-up saat mount

---

## Struktur Folder

```
movie-app/
├── app/
│   ├── layout.tsx          ← Root layout + Navbar + fonts
│   ├── page.tsx            ← Beranda (Server Component)
│   ├── globals.css
│   ├── search/page.tsx     ← Search (Client)
│   ├── watchlist/page.tsx  ← Watchlist (Client + Dexie)
│   ├── movie/[id]/page.tsx ← Detail film (Client)
│   └── genre/[id]/page.tsx ← Browse genre (Client)
├── components/
│   ├── Navbar.tsx          ← Navbar responsive + mobile menu
│   ├── MovieCard.tsx       ← Kartu film dengan watchlist toggle
│   ├── MovieGrid.tsx       ← Grid responsif
│   ├── MovieRow.tsx        ← Horizontal scroll row
│   └── Skeletons.tsx       ← Loading skeleton
├── lib/
│   ├── api.ts              ← TMDB API helpers
│   └── db.ts              ← Dexie watchlist DB
├── public/
│   └── manifest.json       ← PWA manifest
├── .env.local.example      ← Template API key
└── next.config.js          ← Image domain TMDB
```

---

## Responsif

| Breakpoint | Grid film | Layout |
|---|---|---|
| Mobile (< 640px) | 2 kolom | Bottom stack |
| Tablet (640-1024px) | 3-4 kolom | Side by side |
| Desktop (> 1024px) | 5-6 kolom | Full layout |
| 2K+ (> 1280px) | 6 kolom | Max-width 7xl |

---

## Selanjutnya (Opsional)

- [ ] Tambah ikon PWA (icon-192.png & icon-512.png di /public/)
- [ ] Halaman `/actor/[id]` — profil aktor + filmografi
- [ ] Filter advanced di search (tahun, rating minimum, genre)
- [ ] Notifikasi "Film segera tayang" via Web Push
- [ ] Share film ke WhatsApp/media sosial
- [ ] Dark/light mode toggle
- [ ] Import/export watchlist sebagai JSON backup
