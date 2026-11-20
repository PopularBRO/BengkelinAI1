# BengkelinAI + Supabase + Netlify

Paket ini mengintegrasikan website HTML/CSS/JavaScript multi-page BengkelinAI dengan Supabase untuk akun, data kendaraan, diagnosis simulasi, estimasi, permintaan mekanik, pengingat, riwayat, dan pengajuan mitra.

## Isi paket

- `static/`: seluruh frontend 16 halaman HTML, CSS, JavaScript, logo asli.
- `static/supabase-config.js`: tempat memasukkan Supabase Project URL dan publishable key.
- `static/supabase-integration.js`: login, signup email/password, Google OAuth, session, dan operasi database.
- `supabase/schema.sql`: satu file SQL lengkap untuk setup pertama. Salinan migrasi juga tersedia di `supabase/migrations/20261120_bengkelinai_production.sql`. Keduanya berisi tabel, trigger profile, RLS, storage buckets, dan RPC status request.
- `netlify.toml`: publish directory untuk deploy Netlify dari root paket.

## Tahap 1 — Buat project Supabase

1. Buat project di https://supabase.com/dashboard.
2. Simpan database password di password manager. Jangan masukkan password database ke frontend.
3. Buka SQL Editor > New query.
4. Salin seluruh isi `supabase/schema.sql` (atau file migrasi yang identik).
5. Jalankan SQL sekali. Jika ada error, jangan jalankan ulang secara buta. Baca pesan error dan perbaiki penyebabnya dulu.
6. Di Project Settings > API, salin Project URL dan publishable key (`sb_publishable_...`) atau legacy anon public key.

## Tahap 2 — Masukkan konfigurasi frontend

Buka `static/supabase-config.js`, lalu ganti placeholder:

```js
window.BENGKELINAI_SUPABASE_CONFIG = {
  url: 'https://PROJECT_REF.supabase.co',
  publishableKey: 'sb_publishable_xxxxxxxxx'
};
```

Publishable/anon key memang akan terlihat oleh browser. Keamanan data bergantung pada RLS dan grants di SQL. Jangan pernah menggunakan `service_role`, `secret`, database password, atau Google client secret di file frontend.

## Tahap 3 — Konfigurasi Auth email

1. Supabase Dashboard > Authentication > URL Configuration.
2. Site URL: isi URL Netlify Kamu, misalnya `https://nama-site.netlify.app`.
3. Tambahkan Redirect URLs:
   - `https://nama-site.netlify.app/**`
   - `http://localhost:5500/**` (jika menggunakan VS Code Live Server)
   - `http://127.0.0.1:5500/**` (opsional)
4. Authentication > Sign In / Providers > Email. Aktifkan email provider dan tentukan apakah email confirmation diwajibkan. Untuk publik, sebaiknya tetap aktif dan siapkan SMTP kustom saat siap produksi.

Ganti `nama-site.netlify.app` dengan URL yang benar-benar diberikan Netlify.

## Tahap 4 — Konfigurasi Google OAuth

1. Buka Google Cloud Console: https://console.cloud.google.com/.
2. Siapkan OAuth consent screen / Google Auth Platform.
3. Buat OAuth Client ID dengan tipe Web application.
4. Authorized JavaScript origins: URL Netlify Kamu, misalnya `https://nama-site.netlify.app`.
5. Authorized redirect URI: salin callback URL yang ditampilkan di Supabase Dashboard > Authentication > Sign In / Providers > Google. Bentuknya `https://PROJECT_REF.supabase.co/auth/v1/callback`.
6. Masukkan Google Client ID dan Client Secret ke konfigurasi provider Google di Supabase Dashboard. Client Secret hanya disimpan di dashboard Supabase, bukan website.
7. Pastikan URL Netlify juga terdaftar pada Redirect URLs Supabase seperti Tahap 3.

## Tahap 5 — Deploy ke Netlify

Cara yang disarankan:

1. Upload isi paket ke repository GitHub. Pertahankan direktori `bengkelinai-website` dan `supabase` serta file `netlify.toml` di root repository, atau sesuaikan publish directory bila struktur repo berbeda.
2. Netlify > Add new project > Import an existing project > pilih repository.
3. Build command: kosongkan.
4. Publish directory: `static`.
5. Deploy.
6. Setelah mendapat URL Netlify final, masukkan URL itu pada Site URL dan Redirect URLs Supabase.

Paket ini sudah memakai `static/` sebagai root website, sesuai struktur repository GitHub Kamu saat ini. File `app.py` dan `requirements.txt` milik percobaan Streamlit tidak diperlukan oleh Netlify, tetapi boleh dibiarkan di repository; Netlify hanya memublikasikan folder `static/`.

## Tahap 6 — Tes koneksi

1. Buka `https://URL-NETLIFY-KAMU/auth.html`.
2. Buat akun dengan email dan password.
3. Verifikasi email bila diminta.
4. Login, lalu buka `garasi.html` dan simpan kendaraan.
5. Buka Supabase > Table Editor > `profiles` dan `vehicles`. Pastikan baris profil dan kendaraan muncul.
6. Coba Google sign-in setelah provider Google dikonfigurasi.
7. Coba simpan pengingat, estimasi, permintaan mekanik, serta diagnosis foto/suara. Diagnosis file disimpan di bucket privat `diagnosis-media` jika user sudah login.
8. Buka dengan akun kedua untuk memastikan data akun pertama tidak terlihat.

## Tahap 7 — Admin dan partner

Akun baru selalu dibuat sebagai `customer`. Pengguna tidak dapat memilih atau mengubah role sendiri.

Untuk menjadikan akun pertama sebagai admin:
1. Buat akun admin melalui halaman `auth.html`.
2. Supabase > Authentication > Users, salin UUID pengguna tersebut.
3. Jalankan SQL berikut setelah mengganti UUID:

```sql
update public.profiles
set role = 'admin'
where id = 'PASTE_USER_UUID_DI_SINI';
```

Role `mechanic` dan `workshop` harus diberikan oleh admin setelah memeriksa pengajuan di tabel `partner_applications`. Setelah status disetujui, admin membuat record terkait pada tabel `mechanics` atau `workshops`. Jangan memberikan role mitra hanya berdasarkan metadata signup.

## Data yang tersimpan

- Profiles: nama, telepon, role.
- Vehicles: motor/mobil, merek, model, tahun, plat (opsional), odometer.
- Diagnoses: metadata file, mode simulasi, hasil simulasi. File foto/audio disimpan di private bucket.
- Estimates: kisaran simulasi dan parameter perhitungan.
- Service requests: pengajuan pelanggan, kontak, alamat, masalah, status.
- Maintenance reminders: pengingat perawatan.
- Service history: catatan servis.
- Partner applications: pengajuan mekanik/bengkel.
- Contact messages: formulir kontak.
- Workshops/mechanics: direktori mitra yang hanya tampil publik bila aktif dan diverifikasi.

## Status AI

AI tetap simulasi. Kode hanya menyimpan file dan record input serta menyimpan label simulasi. Tidak ada klaim bahwa file dianalisis oleh model AI. Integrasi AI sungguhan nanti harus dilakukan melalui Netlify Functions atau Supabase Edge Functions agar API key model tidak pernah dikirim ke browser.

## Batasan penting sebelum produksi publik

Paket ini adalah baseline backend dan integrasi frontend, bukan sertifikasi keamanan atau sistem produksi penuh yang sudah diuji di project Supabase milik Kamu. Sebelum menerima pelanggan sungguhan:

- Uji seluruh RLS untuk anon, customer, mechanic, workshop, admin.
- Tambahkan rate limiting, proteksi spam/contact form, kebijakan retensi data, dan proses penghapusan akun.
- Konfigurasikan SMTP produksi untuk email Auth.
- Verifikasi bisnis/mitra dan validasi nomor kontak.
- Buat proses admin backend terkontrol untuk menyetujui aplikasi mitra, mengatur assignment, dan mengirim notifikasi.
- Uji pemulihan password, callback Google, dan domain Netlify final.
- Jangan mengaktifkan status bengkel `verified` sebelum verifikasi manual.
- Jangan menaruh data sensitif kendaraan atau pelanggan di bucket publik.

## File yang boleh/pantang dibagikan

Boleh berada di frontend: Project URL, publishable key/anon public key.
Jangan pernah berada di frontend/repository publik: service_role key, Supabase secret key, database password, Google OAuth client secret, private AI provider key.
