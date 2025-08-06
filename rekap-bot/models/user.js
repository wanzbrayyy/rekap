const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  referrals: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  team: {
    type: String,
    default: null,
  },
  withdrawalState: {
    isWaiting: { type: Boolean, default: false },
    amount: { type: Number, default: 0 },
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
