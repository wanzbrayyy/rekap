const User = require('../models/user'); // This will fail until user.js is created. Placeholder.

/**
 * Finds a user by their Telegram username (case-insensitive).
 * Used for admin commands where admins type a name.
 * @param {string} playerName The name of the player.
 * @returns {object | null} The Mongoose User object or null.
 */
async function findUserByUsername(playerName) {
    return await User.findOne({ username: { $regex: new RegExp(`^${playerName}$`, 'i') } });
}

/**
 * Creates or finds a user based on the Telegraf context object.
 * This is the primary way to interact with users who are interacting with the bot.
 * @param {object} ctx The Telegraf context object.
 * @returns {object} The Mongoose User object.
 */
async function findOrCreateUserFromCtx(ctx) {
  return await User.findOneAndUpdate(
    { userId: ctx.from.id },
    {
      $setOnInsert: {
        userId: ctx.from.id,
        username: ctx.from.username || `user${ctx.from.id}`,
        firstName: ctx.from.first_name,
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

/**
 * Finds a user by username, or creates one if they don't exist.
 * This is a fallback for when we only have a name string, e.g., from rekap text.
 * @param {string} playerName The name of the player from the rekap text.
 * @returns {object} The Mongoose User object.
 */
async function findOrCreateUserByUsername(playerName) {
  return await User.findOneAndUpdate(
    { username: { $regex: new RegExp(`^${playerName}$`, 'i') } },
    {
      $setOnInsert: {
        userId: Math.floor(100000000 + Math.random() * 900000000), // Placeholder ID
        firstName: playerName,
        username: playerName,
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

module.exports = {
    findUserByUsername,
    findOrCreateUserFromCtx,
    findOrCreateUserByUsername,
};
