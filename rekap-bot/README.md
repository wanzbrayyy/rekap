# wanzofc kap Bot

Bot Telegram canggih untuk manajemen rekap game, saldo, deposit & penarikan otomatis, serta sistem referral.

## Fitur Utama

- **Rekap Game**: Parsing pesan otomatis untuk rekap taruhan tim K vs B.
- **Manajemen Saldo**: Perintah khusus admin untuk `/tambah`, `/kurangi`, `/lunas`, dan `/bulatkan` saldo pemain.
- **Deposit OCR**: Pengguna mengirim gambar bukti transfer, dan bot otomatis mendeteksi nominal untuk menambah saldo. Notifikasi dikirim ke admin.
- **Sistem Penarikan (Withdrawal)**: Pengguna dapat meminta penarikan dana. Bot akan meminta info pembayaran (No. DANA / QRIS) dan meneruskan permintaan tersebut ke admin untuk diproses.
- **Sistem Referral**: Setiap pengguna memiliki link unik untuk mengundang teman.
- **Pesan Profesional**: Semua output bot diformat dengan rapi dan jelas.
- **Notifikasi Pin**: Rekap game dan konfirmasi deposit akan otomatis di-pin di grup.

## Instalasi & Konfigurasi

### 1. Prasyarat

- [Node.js](https://nodejs.org/) (v16 atau lebih baru)
- [MongoDB](https://www.mongodb.com/try/download/community)
- Akun Telegram & Token Bot dari [@BotFather](https://t.me/BotFather)

### 2. Setup

1.  **Unduh kode ini.**

2.  **Instal Dependensi**
    Buka terminal di direktori proyek dan jalankan:
    ```bash
    npm install
    ```

3.  **Buat File `.env`**
    - Buat file baru bernama `.env` di direktori utama.
    - Isi dengan kredensial yang Anda miliki, mengikuti format ini:
      ```env
      BOT_TOKEN=8085407682:AAF2VKkMf8mOIrYCZq807CQxuiUc35y72ss
      MONGODB_URL=mongodb+srv://zanssxploit:pISqUYgJJDfnLW9b@cluster0.fgram.mongodb.net/scmarket_db?retryWrites=true&w=majority
      ADMIN_ID=7774371395
      ```
    - **Penting:** Gunakan token, URL, dan ID Anda sendiri jika berbeda dari contoh di atas.

4.  **Konfigurasi Tambahan (Opsional)**
    - Buka file `config.js` untuk mengubah nama bot (`botName`) atau deskripsi jika diperlukan.

### 3. Menjalankan Bot

Setelah konfigurasi selesai, jalankan bot dengan perintah:
```bash
npm start
```

Bot Anda sekarang siap digunakan.

## Alur Kerja Penarikan (Withdrawal)

1.  Pengguna mengirim perintah `/withdraw [jumlah]`. Contoh: `/withdraw 50000`.
2.  Bot akan memvalidasi saldo dan meminta pengguna mengirimkan info pembayaran (Nomor DANA atau gambar QRIS).
3.  Pengguna mengirimkan info tersebut sebagai pesan biasa.
4.  Bot akan secara otomatis meneruskan permintaan dan info pembayaran ke Admin utama yang terdaftar untuk diproses secara manual.
5.  Pengguna akan menerima konfirmasi bahwa permintaan mereka telah diteruskan.

---
*Dikembangkan oleh Jules.*
