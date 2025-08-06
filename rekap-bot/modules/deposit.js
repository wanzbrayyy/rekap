const Tesseract = require('tesseract.js');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const { findOrCreateUserFromCtx } = require('./user-helper');

/**
 * Parses OCR text to find a plausible deposit amount.
 * @param {string} text The text recognized by Tesseract.
 * @returns {number} The parsed amount, or 0 if not found.
 */
function parseAmountFromText(text) {
  let bestCandidate = 0;

  // Regex to find numbers, possibly with separators like . or ,
  // It's intentionally broad to catch different formats.
  const amountRegex = /([\d.,]+)/g;
  let match;

  while ((match = amountRegex.exec(text)) !== null) {
    // Clean the number string: remove dots, then replace comma with a dot for decimals.
    const numStr = match[1].replace(/\./g, '').replace(',', '.');
    const num = parseFloat(numStr);

    // Heuristic: Valid bank transfers are usually significant amounts.
    // This avoids recognizing small numbers like dates or reference numbers.
    // We'll also assume whole numbers for deposits.
    if (!isNaN(num) && num >= 10000 && num % 1 === 0) {
      if (num > bestCandidate) {
        bestCandidate = num;
      }
    }
  }

  return bestCandidate;
}

/**
 * Processes a deposit image sent by a user.
 * @param {object} ctx The Telegraf context object.
 * @returns {object} An object with the result of the operation.
 */
async function processDeposit(ctx) {
  // Get the highest resolution photo
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const fileLink = await ctx.telegram.getFileLink(photo.file_id);

  try {
    // Recognize text from the image. Using 'ind' for Indonesian.
    const { data: { text } } = await Tesseract.recognize(fileLink.href, 'ind', {
      logger: m => console.log(m), // Optional: log Tesseract progress
    });

    const amount = parseAmountFromText(text);

    if (amount > 0) {
      const user = await findOrCreateUserFromCtx(ctx);
      user.balance += amount;
      await user.save();

      await Transaction.create({
        userId: user._id,
        amount,
        type: 'deposit',
        status: 'completed',
        description: `Deposit via OCR. Raw text snippet: ${text.substring(0, 100)}...`,
      });

      const message = `✅ Deposit berhasil! Sejumlah ${amount.toLocaleString('id-ID')} telah ditambahkan ke saldo Anda. Saldo baru: ${user.balance.toLocaleString('id-ID')}`;
      return { success: true, message };
    } else {
      return { success: false, message: `❌ OCR tidak dapat menemukan nominal transfer yang valid pada gambar. Mohon coba lagi dengan gambar yang lebih jelas.` };
    }
  } catch (error) {
    console.error("OCR process failed:", error);
    return { success: false, message: "❌ Terjadi kesalahan teknis saat memproses gambar Anda." };
  }
}

module.exports = { processDeposit };
