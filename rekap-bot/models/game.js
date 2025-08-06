const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  isLastWin: { type: Boolean, default: false },
  isPending: { type: Boolean, default: false },
}, { _id: false });

const gameSchema = new mongoose.Schema({
  chatId: {
    type: Number,
    required: true,
    index: true,
  },
  teamK: [playerSchema],
  teamB: [playerSchema],
  status: {
    type: String,
    enum: ['ongoing', 'finished'],
    default: 'ongoing',
  },
  winner: {
    type: String,
    enum: ['K', 'B', null],
    default: null,
  },
  feePercentage: {
    type: Number,
    default: 0,
  },
  messageId: { // To edit the message later
    type: Number,
    required: true,
  }
}, { timestamps: true });

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
