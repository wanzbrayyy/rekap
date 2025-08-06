require('dotenv').config();

// Parse ADMIN_ID from a comma-separated string into an array of numbers
const adminIds = process.env.ADMIN_ID
  ? process.env.ADMIN_ID.split(',').map(id => parseInt(id.trim(), 10))
  : [];

module.exports = {
  token: process.env.BOT_TOKEN,
  mongoUrl: process.env.MONGODB_URL,
  adminIds: adminIds, // Now an array
  botName: "wanzofc kap",
  botDescription: "Bot Rekap Serba Otomatis + Deposit OCR + Referral + Tim",
};
