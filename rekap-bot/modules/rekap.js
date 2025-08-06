const Game = require('../models/game');
const Transaction = require('../models/transaction');
const { findOrCreateUserByUsername } = require('./user-helper');

/**
 * Parses the recap text message.
 * @param {string} text The raw text from the Telegram message.
 * @returns {{teamK: Array, teamB: Array}|null} Parsed teams or null if invalid format.
 */
function parseRecapText(text) {
  const lines = text.trim().split('\n');
  const teams = {
    teamK: [],
    teamB: [],
  };
  let currentTeam = null;
  let teamK_found = false;
  let teamB_found = false;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.toUpperCase() === 'K:') {
      currentTeam = 'teamK';
      teamK_found = true;
      continue;
    }
    if (trimmedLine.toUpperCase() === 'B:') {
      currentTeam = 'teamB';
      teamB_found = true;
      continue;
    }

    if (currentTeam && trimmedLine) {
      const playerRegex = /^([\w\s]+?)\s+([\d,.]+k?)\s*((?:LF|P|\s)*)$/i;
      const match = trimmedLine.match(playerRegex);

      if (match) {
        const name = match[1].trim();
        let amountStr = match[2].toLowerCase();
        let amount;

        amountStr = amountStr.replace(/,/g, '');
        if (amountStr.endsWith('k')) {
          amount = parseFloat(amountStr.slice(0, -1)) * 1000;
        } else {
          amount = parseInt(amountStr, 10);
        }

        const flags = match[3] ? match[3].toUpperCase().split(/\s+/).filter(Boolean) : [];

        teams[currentTeam].push({
          name: name,
          amount: amount,
          isLastWin: flags.includes('LF'),
          isPending: flags.includes('P'),
        });
      }
    }
  }

  if (teamK_found || teamB_found) {
      return teams;
  }
  return null;
}

/**
 * Formats the recap data into a professional message.
 * @param {object} gameData The game data from database.
 * @returns {string} The formatted message text.
 */
function formatRecapMessage(gameData) {
    const totalK = gameData.teamK.reduce((sum, player) => sum + player.amount, 0);
    const totalB = gameData.teamB.reduce((sum, player) => sum + player.amount, 0);
    const difference = Math.abs(totalK - totalB);
    const losingTeam = totalK > totalB ? 'Tim B' : 'Tim K';

    let message = `╭━━━ Rekap Laga Terbaru ━━━╮\n`;
    message += `┃ 🟦 K: ${totalK.toLocaleString('id-ID')}\n`;
    message += `┃ 🟥 B: ${totalB.toLocaleString('id-ID')}\n`;
    if (difference > 0) {
        message += `┃ 🐠 ${losingTeam} kurang ${difference.toLocaleString('id-ID')} untuk seimbang\n`;
    }
    message += `╰━━━━━━━━━━━━━━━━━━━━━━╯`;

    return message;
}

/**
 * Processes the end of a game, calculates winnings, and updates balances.
 * @param {number} chatId The ID of the chat where the command was issued.
 * @param {number} feePercentage The fee to apply to the winnings.
 * @returns {object} An object containing the result message and data.
 */
async function processRekapWin(chatId, feePercentage = 0) {
    const game = await Game.findOne({ chatId, status: 'ongoing' });
    if (!game) {
        return { success: false, message: "❌ Tidak ada rekap yang sedang berjalan." };
    }

    const totalK = game.teamK.reduce((sum, p) => sum + p.amount, 0);
    const totalB = game.teamB.reduce((sum, p) => sum + p.amount, 0);

    if (totalK === totalB) {
        game.status = 'finished';
        await game.save();
        return { success: true, message: "⚖️ Permainan berakhir seri. Tidak ada pemenang.", game };
    }

    const winningTeamName = totalK > totalB ? 'K' : 'B';
    const losingTeamName = totalK > totalB ? 'B' : 'K';
    const winningTeamData = game[`team${winningTeamName}`];
    const losingTeamData = game[`team${losingTeamName}`];
    const totalWinPot = losingTeamData.reduce((sum, p) => sum + p.amount, 0);
    const totalInvest = winningTeamData.reduce((sum, p) => sum + p.amount, 0);

    const feeAmount = totalWinPot * (feePercentage / 100);
    const potAfterFee = totalWinPot - feeAmount;

    let results = [];

    // Process winners
    for (const winner of winningTeamData) {
        const user = await findOrCreateUserByUsername(winner.name);
        const share = winner.amount / totalInvest;
        const winnings = potAfterFee * share;

        user.balance += winnings;
        await user.save();
        await Transaction.create({
            userId: user._id,
            amount: winnings,
            type: 'game_win',
            description: `Menang dari game #${game._id}`,
            relatedGameId: game._id,
        });
        results.push(`- ${winner.name}: +${winnings.toLocaleString('id-ID')}`);
    }

    // Process losers
    for (const loser of losingTeamData) {
        const user = await findOrCreateUserByUsername(loser.name);
        user.balance -= loser.amount; // They lose what they bet
        await user.save();
        await Transaction.create({
            userId: user._id,
            amount: -loser.amount,
            type: 'game_loss',
            description: `Kalah dari game #${game._id}`,
            relatedGameId: game._id,
        });
    }

    game.status = 'finished';
    game.winner = winningTeamName;
    game.feePercentage = feePercentage;
    await game.save();

    const resultMessage = `
🎉 Tim ${winningTeamName} Menang! 🎉
Total Pot: ${totalWinPot.toLocaleString('id-ID')}
Fee (${feePercentage}%): ${feeAmount.toLocaleString('id-ID')}
--------------------
Pemenang:
${results.join('\n')}
    `.trim();

    return { success: true, message: resultMessage, game };
}

async function cancelRekap(chatId) {
    const game = await Game.findOneAndDelete({ chatId, status: 'ongoing' });

    if (!game) {
        return { success: false, message: "❌ Tidak ada rekap yang sedang berjalan untuk dibatalkan." };
    }

    return { success: true, message: "✅ Rekap terakhir telah dibatalkan.", game };
}


module.exports = {
  parseRecapText,
  formatRecapMessage,
  processRekapWin,
  cancelRekap,
};
