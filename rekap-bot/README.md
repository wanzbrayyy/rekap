# Rekap Bot - MICHEL-AI

Bot Telegram Premium untuk manajemen rekap game, saldo, deposit otomatis dengan OCR, dan sistem referral.

## Fitur

- **Rekap Game Otomatis**: Parsing pesan untuk rekap taruhan tim K vs B.
- **Manajemen Saldo**: Perintah admin untuk menambah, mengurangi, melunaskan, dan membulatkan saldo pemain.
- **Deposit OCR**: Kirim gambar bukti transfer dan bot akan otomatis mendeteksi nominal untuk menambah saldo.
- **Sistem Referral**: Setiap pengguna memiliki link unik untuk mengundang teman dan membangun tim.
- **Pesan Profesional**: Semua output bot diformat dengan rapi dan jelas.
- **Notifikasi Pin**: Rekap game dan konfirmasi deposit akan otomatis di-pin di grup.

## Instalasi & Konfigurasi

Ikuti langkah-langkah berikut untuk menjalankan bot Anda sendiri.

### 1. Prasyarat

- [Node.js](https://nodejs.org/) (v16 atau lebih baru)
- [MongoDB](https://www.mongodb.com/try/download/community) (database server)
- Akun Telegram & Token Bot dari [@BotFather](https://t.me/BotFather)

### 2. Setup

1.  **Clone atau unduh repositori ini.**

2.  **Instal dependensi:**
    Buka terminal di direktori proyek dan jalankan:
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    - Buat file baru bernama `.env` di direktori utama proyek.
    - Salin konten dari contoh di bawah ke dalam file `.env` Anda:
      ```env
      BOT_TOKEN=ISI_DENGAN_TOKEN_BOT_ANDA
      MONGODB_URL=mongodb://localhost:27017/rekap-bot
      ```
    - Ganti `ISI_DENGAN_TOKEN_BOT_ANDA` dengan token yang Anda dapatkan dari BotFather.
    - Sesuaikan `MONGODB_URL` jika database Anda berjalan di host atau port yang berbeda.
    - `OCR_API_KEY` tidak diperlukan karena bot ini menggunakan Tesseract.js yang berjalan secara lokal.

4.  **Konfigurasi Admin**
    - Buka file `config.js`.
    - Temukan baris `adminId: [123456789],`.
    - Ganti `123456789` dengan User ID Telegram Anda. Anda bisa mendapatkan ID Anda dari bot seperti [@userinfobot](https://t.me/userinfobot).
    - Anda dapat menambahkan lebih dari satu admin dengan memisahkannya menggunakan koma: `adminId: [123456789, 987654321],`.

### 3. Menjalankan Bot

Setelah konfigurasi selesai, jalankan bot dengan perintah:
```bash
npm start
```

Bot Anda sekarang seharusnya sudah online dan siap digunakan.

---
*Dikembangkan oleh Jules.*
