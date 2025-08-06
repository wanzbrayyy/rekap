const Tesseract = require('tesseract.js');
const Transaction = require('../models/transaction');
const { findOrCreateUserFromCtx } = require('./user-helper');
const config = require('../config');

/**
 * Parses OCR text to find a plausible deposit amount.
 * @param {string} text The text recognized by Tesseract.
 * @returns {number} The parsed amount, or 0 if not found.
 */
function parseAmountFromText(text) {
  let bestCandidate = 0;
  const amountRegex = /([\d.,]+)/g;
  let match;

  while ((match = amountRegex.exec(text)) !== null) {
    const numStr = match[1].replace(/\./g, '').replace(',', '.');
    const num = parseFloat(numStr);

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
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const fileLink = await ctx.telegram.getFileLink(photo.file_id);
  const adminId = config.adminIds[0];

  try {
    const { data: { text } } = await Tesseract.recognize(fileLink.href, 'ind', {
      logger: m => console.log(m),
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

      const successMessage = `✅ Deposit berhasil! Sejumlah ${amount.toLocaleString('id-ID')} telah ditambahkan ke saldo Anda. Saldo baru: ${user.balance.toLocaleString('id-ID')}`;

      // Forward notification to admin
      if (adminId) {
        const adminMessage = `
✅ *Deposit Sukses (OCR)*
-----------------------------------
*Pengguna:* ${user.firstName} (@${user.username || 'N/A'})
*User ID:* \`${user.userId}\`
*Jumlah Deposit:* *${amount.toLocaleString('id-ID')}*
*Saldo Baru:* ${user.balance.toLocaleString('id-ID')}
        `.trim();
        try {
            await ctx.telegram.sendMessage(adminId, adminMessage, { parse_mode: 'Markdown' });
        } catch (e) {
            console.error("Failed to send deposit notification to admin:", e);
        }
      }

      return { success: true, message: successMessage };
    } else {
      return { success: false, message: `❌ OCR tidak dapat menemukan nominal transfer yang valid pada gambar.` };
    }
  } catch (error) {
    console.error("OCR process failed:", error);
    return { success: false, message: "❌ Terjadi kesalahan teknis saat memproses gambar Anda." };
  }
}

module.exports = { processDeposit };
