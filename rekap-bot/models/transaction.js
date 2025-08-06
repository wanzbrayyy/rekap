const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'game_win', 'game_loss', 'fee_charge', 'manual_add', 'manual_subtract', 'rounding'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  description: { // For storing extra details like which game it was for, or OCR text
    type: String,
    default: '',
  },
  relatedGameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    default: null,
  }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
