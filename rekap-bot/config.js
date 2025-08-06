require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  mongoUrl: process.env.MONGODB_URL,
  ocrApiKey: process.env.OCR_API_KEY,
  adminId: [123456789],
  botName: "MICHEL-AI",
  botDescription: "Bot Rekap Serba Otomatis + Deposit OCR + Referral + Tim",
  prefixEmoji: "💎"
};
