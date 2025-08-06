const { Telegraf } = require('telegraf');
const mongoose = require('mongoose');
const config = require('./config');
require('dotenv').config();

const bot = new Telegraf(config.token);

// ===== Database =====
mongoose.connect(config.mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Database Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// ===== Commands =====
bot.start((ctx) => {
  ctx.replyWithMarkdown(`
*${config.prefixEmoji} Selamat Datang di ${config.botName}!*
${config.botDescription}

🔹 Gunakan /rekap untuk melihat rekap game
🔹 Gunakan /profile untuk melihat saldo & referral Anda
  `);
});

// Rekap Game
bot.command('rekap', async (ctx) => {
  // TODO: Ambil data game dari DB dan tampilkan rekap otomatis
  ctx.reply('📊 Rekap game terbaru:\n\n[contoh output]');
});

// Deposit via Gambar (OCR)
bot.on('photo', async (ctx) => {
  // TODO: Ambil gambar, kirim ke OCR API, deteksi nominal
  // TODO: Tambahkan saldo otomatis dan konfirmasi
  ctx.reply('🔹 Deposit Anda sedang diproses melalui OCR...');
});

// Profile
bot.command('profile', async (ctx) => {
  // TODO: Tampilkan saldo, referral, dan tim user
  ctx.reply('👤 Profil Anda:\nSaldo: 0\nReferral: 0\nTim: -');
});

bot.launch();
console.log('🚀 Bot is running...');
