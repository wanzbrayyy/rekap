const { Telegraf, Markup } = require('telegraf');
const { connectDB } = require('./database');
const config = require('./config');
const UserHelper = require('./modules/user-helper');
const WithdrawHandler = require('./modules/withdraw');
const RekapHandler = require('./modules/rekap');
const SaldoHandler = require('./modules/saldo');
const ReferralHandler = require('./modules/referral');
const DepositHandler = require('./modules/deposit');
const { setSetting, getSetting } = require('./models/settings');
const Game = require('./models/game');

// Connect to Database
connectDB();

const bot = new Telegraf(config.token);

// Middleware to check for withdrawal state
bot.use(async (ctx, next) => {
    if (ctx.message) {
        const user = await UserHelper.findOrCreateUserFromCtx(ctx);
        if (user && user.withdrawalState && user.withdrawalState.isWaiting) {
            // This user is in the middle of a withdrawal process.
            // Let's process their message as payment info.
            const result = await WithdrawHandler.processWithdrawalInfo(ctx);
            return ctx.reply(result.message);
        }
    }
    return next();
});

// ===== Admin Middleware =====
const adminOnly = (ctx, next) => {
    if (config.adminIds.includes(ctx.from.id)) {
      return next();
    } else {
      // No reply for non-admins to keep it silent
    }
};


bot.start(async (ctx) => {
    try {
      if (ctx.startPayload) {
        await ReferralHandler.processReferral(ctx);
      }
      await UserHelper.findOrCreateUserFromCtx(ctx);

      const welcomeMessage = `
*Selamat Datang di ${config.botName}!*
${config.botDescription}

Silakan pilih menu di bawah ini:
      `;

      const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('👤 Profil Saya', 'show_profile'), Markup.button.callback('💸 Tarik Saldo', 'guide_withdraw')],
        [Markup.button.callback('Deposit via OCR', 'guide_deposit'), Markup.button.callback('💌 Undang Teman', 'show_referral_link')]
      ]);

      await ctx.replyWithMarkdown(welcomeMessage, keyboard);
    } catch (error) {
      console.error("Error in /start command:", error);
    }
});

bot.command('profile', async (ctx) => {
    try {
      const user = await UserHelper.findOrCreateUserFromCtx(ctx);
      const message = await ReferralHandler.getProfileMessage(user, ctx.botInfo.username);
      await ctx.replyWithMarkdown(message, { disable_web_page_preview: true });
    } catch (error) {
      console.error("Error in /profile command:", error);
      ctx.reply("❌ Terjadi kesalahan saat mengambil profil Anda.");
    }
});

bot.command('withdraw', async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Format salah. Gunakan: /withdraw [jumlah]');
    }
    const amount = parseInt(args[1], 10);

    const result = await WithdrawHandler.startWithdrawal(ctx, amount);
    return ctx.reply(result.message);
});


bot.command('rekapwin', async (ctx) => {
    try {
      const args = ctx.message.text.split(' ');
      const feePercentage = args[1] ? parseFloat(args[1]) : 0;

      if (isNaN(feePercentage) || feePercentage < 0 || feePercentage > 100) {
        return ctx.reply('❌ Fee tidak valid. Harap masukkan angka antara 0 dan 100.');
      }

      const result = await RekapHandler.processRekapWin(ctx.chat.id, feePercentage);

      if (!result.success) {
        return ctx.reply(result.message);
      }

      try {
        await ctx.unpinChatMessage(result.game.messageId);
      } catch (unpinError) {
        console.warn("Could not unpin message:", unpinError.message);
      }

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
      const result = await RekapHandler.cancelRekap(ctx.chat.id);

      if (!result.success) {
        return ctx.reply(result.message);
      }

      try {
        await ctx.unpinChatMessage(result.game.messageId);
        await ctx.deleteMessage(result.game.messageId);
      } catch (error) {
        console.warn("Could not unpin/delete message:", error.message);
      }

      const confirmation = await ctx.reply(result.message);
      setTimeout(() => ctx.deleteMessage(confirmation.message_id), 5000);

    } catch (error) {
      console.error("Error in /cancelrekap:", error);
      ctx.reply('❌ Terjadi kesalahan saat membatalkan rekap.');
    }
});

// ===== Saldo Management Commands =====

bot.command('wd', adminOnly, async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
        return ctx.reply('Format salah. Gunakan: /wd [nama]');
    }
    const playerName = args.slice(1).join(' ');
    const result = await SaldoHandler.getBalance(playerName);
    ctx.reply(result.message);
});

bot.command('tambah', adminOnly, async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('Format salah. Gunakan: /tambah [nama] [jumlah]');
    }
    const playerName = args[1];
    const amount = parseInt(args[2].replace(/,/g, ''), 10);

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

bot.command('kurangi', adminOnly, async (ctx) => {
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
        return ctx.reply('Format salah. Gunakan: /kurangi [nama] [jumlah]');
    }
    const playerName = args[1];
    const amount = parseInt(args[2].replace(/,/g, ''), 10);

    if (isNaN(amount) || amount <= 0) {
        return ctx.reply('❌ Jumlah tidak valid.');
    }

    const result = await SaldoHandler.adjustBalance({
        playerName,
        amount: -amount,
        type: 'manual_subtract',
        adminUsername: ctx.from.username,
    });
    ctx.reply(result.message);
});

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

bot.command('setgroup', adminOnly, async (ctx) => {
    if (ctx.chat.type !== 'group' && ctx.chat.type !== 'supergroup') {
        return ctx.reply('❌ Perintah ini hanya bisa digunakan di dalam grup.');
    }

    try {
        const chatMember = await ctx.getChatMember(ctx.botInfo.id);
        if (chatMember.status !== 'administrator' || !chatMember.can_pin_messages) {
            return ctx.reply('❌ Saya harus menjadi admin di grup ini dan memiliki izin untuk "Pin Messages" agar fitur ini berfungsi.');
        }

        await setSetting('activeChatId', ctx.chat.id);
        await ctx.reply(`✅ Grup ini (${ctx.chat.title}) telah ditetapkan sebagai grup aktif. Pesan rekap dan deposit akan di-pin di sini.`);

    } catch (error) {
        console.error("Error in /setgroup:", error);
        ctx.reply("❌ Terjadi kesalahan saat memeriksa status admin saya.");
    }
});


bot.on('photo', async (ctx) => {
    if (ctx.message.caption && ctx.message.caption.startsWith('/')) {
      return;
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

      if (result.success) {
        const activeChatId = await getSetting('activeChatId');
        if (ctx.chat.id === activeChatId) {
            await ctx.pinChatMessage(processingMessage.message_id);
        }
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

bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const parsedData = RekapHandler.parseRecapText(text);

    if (parsedData && (parsedData.teamK.length > 0 || parsedData.teamB.length > 0)) {
      try {
        const formattedMessage = RekapHandler.formatRecapMessage(parsedData);
        const sentMessage = await ctx.reply(formattedMessage);

        await Game.findOneAndUpdate(
          { chatId: ctx.chat.id, status: 'ongoing' },
          {
            ...parsedData,
            chatId: ctx.chat.id,
            messageId: sentMessage.message_id,
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        const activeChatId = await getSetting('activeChatId');
        if (ctx.chat.id === activeChatId) {
            await ctx.pinChatMessage(sentMessage.message_id);
        }

      } catch (error) {
        console.error("Error processing recap:", error);
        ctx.reply("❌ Terjadi kesalahan saat memproses rekap.");
      }
    }
});


// ===== Callback Query Handlers for Main Menu =====
bot.action('show_profile', async (ctx) => {
    try {
        const user = await UserHelper.findOrCreateUserFromCtx(ctx);
        const message = await ReferralHandler.getProfileMessage(user, ctx.botInfo.username);
        await ctx.editMessageText(message, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (error) {
        console.error("Error in show_profile action:", error);
        await ctx.answerCbQuery("❌ Terjadi kesalahan.");
    }
});

bot.action('guide_withdraw', async (ctx) => {
    const message = "Untuk menarik saldo, gunakan perintah:\n`/withdraw [jumlah]`\n\nContoh:\n`/withdraw 50000`";
    await ctx.replyWithMarkdown(message);
    await ctx.answerCbQuery();
});

bot.action('guide_deposit', async (ctx) => {
    const message = "Untuk melakukan deposit, cukup kirimkan foto bukti transfer Anda yang jelas ke chat ini. Bot akan memprosesnya secara otomatis.";
    await ctx.reply(message);
    await ctx.answerCbQuery();
});

bot.action('show_referral_link', async (ctx) => {
    try {
        const user = await UserHelper.findOrCreateUserFromCtx(ctx);
        const referralLink = `https://t.me/${ctx.botInfo.username}?start=${user.userId}`;
        const message = `💌 Undang teman Anda dengan link di bawah ini:\n\n\`${referralLink}\``;
        await ctx.replyWithMarkdown(message);
    } catch (error) {
        console.error("Error in show_referral_link action:", error);
        await ctx.answerCbQuery("❌ Terjadi kesalahan.");
    }
});


bot.launch();
console.log(`🚀 Bot ${config.botName} is running...`);
