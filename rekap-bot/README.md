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

### 3. Konfigurasi
    - Buka file `config.js`.
    - Edit nilai-nilai di dalamnya (seperti `token`, `mongoUrl`, `adminIds`, `botName`) sesuai dengan kebutuhan Anda.
    - **Penting:** Pastikan Anda memasukkan token bot, URL database, dan ID admin Anda sendiri.

### 4. Menjalankan Bot

Setelah konfigurasi selesai, jalankan bot dengan perintah:
```bash
npm start
```

Bot Anda sekarang siap digunakan.

## Perintah & Fitur Penting

### Menu Utama
Saat Anda memulai bot dengan `/start`, Anda akan disambut dengan menu tombol interaktif untuk navigasi yang mudah ke fitur-fitur seperti Profil, Penarikan, dan lainnya.

### Pengaturan Grup (Khusus Admin)
Untuk memastikan bot menyematkan (pin) pesan rekap dan deposit di grup yang benar, admin harus melakukan pengaturan satu kali:
1. Tambahkan bot ke grup Anda.
2. Berikan hak **Admin** kepada bot, termasuk izin untuk **"Pin Messages"**.
3. Ketik perintah `/setgroup` di grup tersebut.

Bot akan mengkonfirmasi jika pengaturan berhasil. Setelah itu, semua pin akan diarahkan ke grup tersebut.

### Alur Kerja Penarikan (Withdrawal)
1.  Gunakan tombol "Tarik Saldo" dari menu utama atau ketik `/withdraw [jumlah]`. Contoh: `/withdraw 50000`.
2.  Bot akan memvalidasi saldo dan meminta Anda mengirimkan info pembayaran (Nomor DANA atau gambar QRIS).
3.  Kirim info tersebut sebagai pesan biasa.
4.  Bot akan secara otomatis meneruskan permintaan dan info pembayaran ke Admin untuk diproses secara manual.
5.  Anda akan menerima konfirmasi bahwa permintaan telah diteruskan.

---
*Dikembangkan oleh Jules.*
