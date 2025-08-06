const { Telegraf, Markup } = require('telegraf');
const { connectDB } = require('./database');
const config = require('./config');
const { parseRecapText, formatRecapMessage, processRekapWin, cancelRekap } = require('./modules/rekap');
const SaldoHandler = require('./modules/saldo');
const ReferralHandler = require('./modules/referral');
const DepositHandler = require('./modules/deposit');
const Game = require('./models/game');
const User = require('./models/user');
const Transaction = require('./models/transaction');

// Connect to Database
connectDB();

const bot = new Telegraf(config.token);

// ===== Middleware for Admin Check =====
const adminOnly = (ctx, next) => {
  if (config.adminId.includes(ctx.from.id)) {
    return next();
  } else {
    return ctx.reply('⛔ Anda tidak memiliki izin untuk menggunakan perintah ini.');
  }
};

// ===== Commands =====
bot.start(async (ctx) => {
  try {
    // Process referral if a payload exists
    if (ctx.startPayload) {
      await ReferralHandler.processReferral(ctx);
    }
    // Ensure the user exists in the DB
    await ReferralHandler.findOrCreateUserFromCtx(ctx);

    await ctx.replyWithMarkdown(`
*${config.prefixEmoji} Selamat Datang di ${config.botName}!*
${config.botDescription}

🔹 Kirim rekap dalam format 'K:' dan 'B:' untuk memulai.
🔹 Gunakan /profile untuk melihat saldo & referral Anda.
  `);
  } catch (error) {
    console.error("Error in /start command:", error);
  }
});

bot.command('rekapwin', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ');
    const feePercentage = args[1] ? parseFloat(args[1]) : 0;

    if (isNaN(feePercentage) || feePercentage < 0 || feePercentage > 100) {
      return ctx.reply('❌ Fee tidak valid. Harap masukkan angka antara 0 dan 100.');
    }

    const result = await processRekapWin(ctx.chat.id, feePercentage);

    if (!result.success) {
      return ctx.reply(result.message);
    }

    // Unpin the original message
    try {
      await ctx.unpinChatMessage(result.game.messageId);
    } catch (unpinError) {
      // Ignore if it fails (e.g., message not pinned, not enough rights)
      console.warn("Could not unpin message:", unpinError.message);
    }

    // Edit the original message with the results
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      result.game.messageId,
      null,
      result.message
    );

  } catch (error) {
    console.error("Error in /rekapwin:", error);
    ctx.reply('❌ Terjadi kesalahan saat memproses hasil kemenangan.');
  }
});

bot.command('cancelrekap', async (ctx) => {
  try {
    const result = await cancelRekap(ctx.chat.id);

    if (!result.success) {
      return ctx.reply(result.message);
    }

    // Unpin and delete the original message
    try {
      await ctx.unpinChatMessage(result.game.messageId);
      await ctx.deleteMessage(result.game.messageId);
    } catch (error) {
      console.warn("Could not unpin/delete message:", error.message);
    }

    // Send a confirmation message and delete it after a few seconds
    const confirmation = await ctx.reply(result.message);
    setTimeout(() => ctx.deleteMessage(confirmation.message_id), 5000);

  } catch (error) {
    console.error("Error in /cancelrekap:", error);
    ctx.reply('❌ Terjadi kesalahan saat membatalkan rekap.');
  }
});

// Rekap Game via Text Listener
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  const parsedData = parseRecapText(text);

  if (parsedData && (parsedData.teamK.length > 0 || parsedData.teamB.length > 0)) {
    try {
      const formattedMessage = formatRecapMessage(parsedData);
      const sentMessage = await ctx.reply(formattedMessage);

      // Create or update the game in the database
      const game = await Game.findOneAndUpdate(
        { chatId: ctx.chat.id, status: 'ongoing' },
        {
          ...parsedData,
          chatId: ctx.chat.id,
          messageId: sentMessage.message_id,
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Pin the message
      await ctx.pinChatMessage(sentMessage.message_id);

    } catch (error) {
      console.error("Error processing recap:", error);
      ctx.reply("❌ Terjadi kesalahan saat memproses rekap.");
    }
  }
});


// Deposit via Gambar (OCR)
bot.on('photo', async (ctx) => {
  // Check if the photo was sent with a caption that could be a command
  if (ctx.message.caption && ctx.message.caption.startsWith('/')) {
    return; // Ignore photos that are part of a command
  }

  let processingMessage;
  try {
    processingMessage = await ctx.reply('⏳ Memproses deposit Anda melalui OCR, mohon tunggu...');

    const result = await DepositHandler.processDeposit(ctx);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      processingMessage.message_id,
      null,
      result.message
    );

    // If successful, pin the confirmation message
    if (result.success) {
      await ctx.pinChatMessage(processingMessage.message_id);
    }

  } catch (error) {
    console.error("Error in photo handler:", error);
    if (processingMessage) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        processingMessage.message_id,
        null,
        '❌ Terjadi kesalahan fatal saat memproses deposit Anda.'
      );
    } else {
      ctx.reply('❌ Terjadi kesalahan fatal saat memproses deposit Anda.');
    }
  }
});

// ===== Saldo Management Commands =====

// Cek Saldo
bot.command('wd', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Format salah. Gunakan: /wd [nama]');
    }
    const playerName = args.slice(1).join(' ');
    const result = await SaldoHandler.getBalance(playerName);
    ctx.reply(result.message);
});

// Tambah Saldo
bot.command('tambah', adminOnly, async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('Format salah. Gunakan: /tambah [nama] [jumlah]');
    }
    const playerName = args[1];
    const amount = parseInt(args[2], 10);

    if (isNaN(amount) || amount <= 0) {
        return ctx.reply('❌ Jumlah tidak valid.');
    }

    const result = await SaldoHandler.adjustBalance({
        playerName,
        amount,
        type: 'manual_add',
        adminUsername: ctx.from.username,
    });
    ctx.reply(result.message);
});

// Kurangi Saldo
bot.command('kurangi', adminOnly, async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('Format salah. Gunakan: /kurangi [nama] [jumlah]');
    }
    const playerName = args[1];
    const amount = parseInt(args[2], 10);

    if (isNaN(amount) || amount <= 0) {
        return ctx.reply('❌ Jumlah tidak valid.');
    }

    const result = await SaldoHandler.adjustBalance({
        playerName,
        amount: -amount, // Subtracting
        type: 'manual_subtract',
        adminUsername: ctx.from.username,
    });
    ctx.reply(result.message);
});

// Lunas
bot.command('lunas', adminOnly, async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Format salah. Gunakan: /lunas [nama]');
    }
    const playerName = args.slice(1).join(' ');
    const result = await SaldoHandler.setBalanceToZero({
        playerName,
        adminUsername: ctx.from.username,
    });
    ctx.reply(result.message);
});

// Bulatkan
bot.command('bulatkan', adminOnly, async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Format salah. Gunakan: /bulatkan [nama]');
    }
    const playerName = args.slice(1).join(' ');
    const result = await SaldoHandler.roundBalance({
        playerName,
        adminUsername: ctx.from.username,
    });
    ctx.reply(result.message);
});


// Profile
bot.command('profile', async (ctx) => {
  try {
    const user = await ReferralHandler.findOrCreateUserFromCtx(ctx);
    const message = await ReferralHandler.getProfileMessage(user, ctx.botInfo.username);
    await ctx.replyWithMarkdown(message, { disable_web_page_preview: true });
  } catch (error) {
    console.error("Error in /profile command:", error);
    ctx.reply("❌ Terjadi kesalahan saat mengambil profil Anda.");
  }
});

bot.launch();
console.log(`🚀 Bot ${config.botName} is running...`);
