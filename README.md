# 🎬 CineVault — Premium Movie Watchlist & PWA Assistant

CineVault (Cinemalist) adalah aplikasi web pelacak film premium berbasis **Progressive Web App (PWA)** yang dibangun menggunakan **Next.js 14**, **Tailwind CSS**, **Framer Motion**, dan **Dexie.js (IndexedDB)**. 

Aplikasi ini dirancang untuk memberikan pengalaman selayaknya aplikasi ponsel native (Android & iOS) secara cepat, interaktif, ringan, dan dapat diakses sepenuhnya secara luring (offline).

---

## ✨ Fitur Premium Unggulan

### 1. 🤖 CineBot AI (Gemini 2.5 Flash Assistant)
Asisten cerdas bertenaga **Google Gemini 2.5 Flash** yang siap membantu Anda menemukan film terbaik. Anda dapat curhat mengenai suasana hati atau kriteria film yang Anda cari, dan CineBot akan memberikan daftar film beserta kartu TMDB interaktif yang memuat poster dan rating asli.

### 2. 📸 Instagram Share Card Generator (HTML5 Canvas)
Bagikan film favorit Anda ke media sosial dalam bentuk visual poster cerita yang estetik! Fitur ini menggambar ulasan bintang, ulasan teks pribadi, tahun rilis, dan backdrop film ke dalam resolusi tinggi (1080x1920) secara instan tanpa pustaka pihak ketiga.

### 3. 🏆 Watchlist Achievements (Gamifikasi)
Rasakan keseruan mengumpulkan lencana prestasi berdasarkan aktivitas tontonan Anda! Terdapat 5 lencana interaktif (seperti *Adrenaline Junkie* ⚡ atau *Pemikir Ulung* 🧩) yang dihitung secara dinamis dari database offline Anda.

### 4. 🎤 Pencarian Suara (Voice Search)
Gunakan kekuatan **Web Speech Recognition API** untuk mencari film hanya dengan mengucapkan judulnya langsung ke kolom pencarian tanpa perlu mengetik.

### 5. 🔊 Pembaca Sinopsis Suara (TTS Reader)
Membacakan sinopsis film menggunakan suara natural bahasa Indonesia berbasis **Speech Synthesis API** dengan kontrol putar/jeda interaktif.

### 6. 🔔 Pengingat Rilis Film Offline (Release Reminders)
Jadwalkan notifikasi untuk film-film mendatang (upcoming). Sistem Service Worker lokal akan memicu notifikasi push ke layar perangkat Anda ketika film tersebut resmi dirilis.

### 🎨 7. Playful Light Mode Toggle
Transisi tema terang (warna vanilla & lavender yang ceria) dan tema gelap sinematik yang mulus menggunakan Framer Motion dengan skrip pencegah flicker visual.

---

## 🛠️ Teknologi & Arsitektur

*   **Framework:** Next.js 14 (App Router)
*   **Aset Database:** TMDB API (The Movie Database)
*   **Penyimpanan Offline:** Dexie.js (Wrapper IndexedDB berkinerja tinggi)
*   **Animasi:** Framer Motion & CSS Variables
*   **PWA Integrasi:** Service Worker lokal (`sw.js`) & `manifest.json`

---

## 🚀 Memulai Secara Lokal

### 1. Salin Proyek & Install Dependensi
Masuk ke direktori `movie-app` dan jalankan:
```bash
cd movie-app
npm install
```

### 2. Konfigurasi Variabel Lingkungan
Buat berkas `.env.local` di dalam folder `movie-app` dan tambahkan kunci Anda:
```env
NEXT_PUBLIC_TMDB_KEY=isi_api_key_tmdb_anda
NEXT_PUBLIC_GEMINI_KEY=isi_api_key_gemini_anda
```

### 3. Jalankan Mode Pengembangan
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🌐 Panduan Deployment

Saat melakukan deploy ke platform cloud (seperti **Vercel**, **Netlify**, atau **Cloudflare Pages**):
1. Hubungkan repositori GitHub Anda.
2. Tambahkan variabel lingkungan (`Environment Variables`) berikut di dashboard hosting Anda:
    * `NEXT_PUBLIC_TMDB_KEY` (Kunci API TMDB Anda)
    * `NEXT_PUBLIC_GEMINI_KEY` (Kunci API Gemini Anda)
3. Platform akan secara otomatis membangun dan menyajikan aplikasi publik Anda!
