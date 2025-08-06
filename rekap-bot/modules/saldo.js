const Transaction = require('../models/transaction');
const { findUserByUsername, findOrCreateUserByUsername } = require('./user-helper');

async function adjustBalance({ playerName, amount, type, adminUsername }) {
    const user = await findOrCreateUserByUsername(playerName);
    if (!user) {
        return { success: false, message: `❌ Gagal membuat atau menemukan pemain ${playerName}.` };
    }

    user.balance += amount;
    await user.save();

    await Transaction.create({
        userId: user._id,
        amount: amount,
        type: type,
        description: `Oleh admin: ${adminUsername}`,
    });

    const action = amount > 0 ? "ditambahkan" : "dikurangi";
    const message = `✅ Saldo ${user.username} berhasil ${action} sebesar ${Math.abs(amount).toLocaleString('id-ID')}.\nSaldo baru: ${user.balance.toLocaleString('id-ID')}`;
    return { success: true, message };
}

async function setBalanceToZero({ playerName, adminUsername }) {
    const user = await findUserByUsername(playerName);
    if (!user) {
        return { success: false, message: `❌ Pemain ${playerName} tidak ditemukan.` };
    }
    if (user.balance === 0) {
        return { success: false, message: `💡 Saldo ${playerName} sudah 0.` };
    }

    const amountToClear = -user.balance;
    user.balance = 0;
    await user.save();

    await Transaction.create({
        userId: user._id,
        amount: amountToClear,
        type: 'manual_subtract',
        description: `Saldo dilunaskan oleh admin: ${adminUsername}`,
    });

    return { success: true, message: `✅ Saldo ${playerName} telah dilunaskan (dari ${(-amountToClear).toLocaleString('id-ID')} menjadi 0).` };
}

async function roundBalance({ playerName, adminUsername }) {
    const user = await findUserByUsername(playerName);
    if (!user) {
        return { success: false, message: `❌ Pemain ${playerName} tidak ditemukan.` };
    }

    const roundedBalance = Math.round(user.balance / 1000) * 1000;
    const amountChange = roundedBalance - user.balance;

    if (amountChange === 0) {
        return { success: false, message: `💡 Saldo ${playerName} sudah bulat.` };
    }

    user.balance = roundedBalance;
    await user.save();

    await Transaction.create({
        userId: user._id,
        amount: amountChange,
        type: 'rounding',
        description: `Saldo dibulatkan oleh admin: ${adminUsername}`,
    });

    return { success: true, message: `✅ Saldo ${playerName} telah dibulatkan menjadi ${roundedBalance.toLocaleString('id-ID')}.` };
}

async function getBalance(playerName) {
    const user = await findUserByUsername(playerName);
    if (!user) {
        return { success: false, message: `❌ Pemain ${playerName} tidak ditemukan.` };
    }
    return { success: true, message: `💰 Saldo ${playerName}: ${user.balance.toLocaleString('id-ID')}` };
}


module.exports = {
    adjustBalance,
    setBalanceToZero,
    roundBalance,
    getBalance,
};
