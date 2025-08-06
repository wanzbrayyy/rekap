const User = require('../models/user');
const { findOrCreateUserFromCtx } = require('./user-helper');

/**
 * Generates the formatted profile message for a user.
 * @param {object} user The user document from the database.
 * @param {string} botUsername The bot's username for the referral link.
 * @returns {string} The formatted profile message.
 */
async function getProfileMessage(user, botUsername) {
  if (!user) {
    return "Silakan /start untuk membuat profil Anda terlebih dahulu.";
  }

  const referralCount = user.referrals ? user.referrals.length : 0;
  const referralLink = `https://t.me/${botUsername}?start=${user.userId}`;

  const message = `
👤 *Profil Anda*
─────────────
*Nama:* ${user.firstName} (@${user.username})
*Saldo:* ${user.balance.toLocaleString('id-ID')}
*Tim:* ${user.team || 'Belum ada'}

🔗 *Link Referral Anda*
─────────────
Anda telah mengundang: *${referralCount} pemain*
Bagikan link ini untuk mendapatkan bonus:
\`${referralLink}\`
  `.trim();

  return message;
}

/**
 * Processes a new user who joins with a referral link.
 * @param {object} ctx The Telegraf context object.
 */
async function processReferral(ctx) {
  const referrerId = ctx.startPayload;
  const newUserInfo = ctx.from;

  if (!referrerId || String(newUserInfo.id) === referrerId) {
    return; // No referrer or user is referring themselves
  }

  const existingUser = await User.findOne({ userId: newUserInfo.id });
  if (existingUser && existingUser.referredBy) {
    return; // User already exists and has a referrer
  }

  const referrer = await User.findOne({ userId: referrerId });
  if (!referrer) {
    return; // Referrer not found
  }

  // Create the new user with referral info
  const newUser = await findOrCreateUserFromCtx(ctx);
  newUser.referredBy = referrer._id;
  newUser.team = referrer.team || referrer.username; // Join referrer's team, or create one based on username
  await newUser.save();

  // Add the new user to the referrer's list
  await User.findByIdAndUpdate(referrer._id, {
    $addToSet: { referrals: newUser._id }
  });

  // Notify the referrer
  try {
    await ctx.telegram.sendMessage(referrer.userId, `🎉 Selamat! ${newUserInfo.first_name} telah bergabung menggunakan link referral Anda.`);
  } catch (e) {
    console.error(`Failed to send referral notification to ${referrer.userId}`, e);
  }
}

module.exports = {
  findOrCreateUserFromCtx,
  getProfileMessage,
  processReferral,
};
