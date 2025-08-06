const User = require('../models/user');
const Transaction = require('../models/transaction');
const { findOrCreateUserFromCtx } = require('./user-helper');
const config = require('../config');

/**
 * Initiates the withdrawal process for a user.
 * @param {object} ctx The Telegraf context object.
 * @param {number} amount The amount to withdraw.
 * @returns {object} A result object with a message for the user.
 */
async function startWithdrawal(ctx, amount) {
  const user = await findOrCreateUserFromCtx(ctx);

  if (isNaN(amount) || amount <= 0) {
    return { success: false, message: '❌ Jumlah tidak valid. Harap masukkan angka yang benar.' };
  }

  if (user.balance < amount) {
    return { success: false, message: `❌ Saldo Anda tidak mencukupi. Saldo Anda: ${user.balance.toLocaleString('id-ID')}` };
  }

  // Set user state to waiting for payment info
  user.withdrawalState.isWaiting = true;
  user.withdrawalState.amount = amount;
  await user.save();

  return { success: true, message: '✅ Permintaan penarikan diterima. Silakan kirim nomor DANA atau foto QRIS Anda sekarang.' };
}

/**
 * Processes the payment info sent by the user and forwards it to the admin.
 * @param {object} ctx The Telegraf context object.
 * @returns {object} A result object.
 */
async function processWithdrawalInfo(ctx) {
  const user = await findOrCreateUserFromCtx(ctx);
  const adminId = config.adminIds[0]; // Assuming the first admin is the primary one

  if (!adminId) {
    console.error("No admin ID configured to forward withdrawal request.");
    return { success: false, message: '❌ Maaf, terjadi kesalahan teknis. Admin tidak dikonfigurasi.' };
  }

  const withdrawalAmount = user.withdrawalState.amount;

  // 1. Format the details message for the admin
  const detailsMessage = `
⚠️ *Permintaan Penarikan Baru* ⚠️
-----------------------------------
*Pengguna:* ${user.firstName} (@${user.username || 'N/A'})
*User ID:* \`${user.userId}\`
*Jumlah Penarikan:* *${withdrawalAmount.toLocaleString('id-ID')}*
*Sisa Saldo:* ${(user.balance - withdrawalAmount).toLocaleString('id-ID')}
-----------------------------------
Info pembayaran ada di pesan berikutnya.
  `.trim();

  // 2. Send the details to the admin
  await ctx.telegram.sendMessage(adminId, detailsMessage, { parse_mode: 'Markdown' });

  // 3. Forward the user's message (containing payment info) to the admin
  await ctx.forwardMessage(adminId);

  // 4. Update user's balance and create transaction
  user.balance -= withdrawalAmount;
  await Transaction.create({
    userId: user._id,
    amount: -withdrawalAmount,
    type: 'withdrawal',
    status: 'pending', // Admin needs to confirm payment
    description: `Withdrawal request forwarded to admin.`,
  });

  // 5. Reset user's state
  user.withdrawalState.isWaiting = false;
  user.withdrawalState.amount = 0;
  await user.save();

  return { success: true, message: '✅ Info pembayaran Anda telah diteruskan ke admin untuk diproses. Mohon tunggu konfirmasi.' };
}

module.exports = {
  startWithdrawal,
  processWithdrawalInfo,
};
