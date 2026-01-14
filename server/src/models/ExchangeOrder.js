const mongoose = require('mongoose');

/**
 * 💱 Exchange Order
 *
 * Tracks buy/sell orders on the exchange.
 */
const exchangeOrderSchema = new mongoose.Schema({
  // User placing the order
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Order type
  orderType: {
    type: String,
    enum: ['buy', 'sell'],  // buy EXC, sell EXC
    required: true
  },

  // Currency being exchanged (BTC, ETH, LTC, USD)
  currency: {
    type: String,
    required: true,
    uppercase: true
  },

  // Amount of EXC involved
  excAmount: {
    type: Number,
    required: true
  },

  // Amount of other currency involved
  currencyAmount: {
    type: Number,
    required: true
  },

  // Exchange rate at time of order
  exchangeRate: {
    type: Number,
    required: true
  },

  // Trading fee (in EXC)
  fee: {
    type: Number,
    default: 0
  },

  // Order status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },

  // For sells: user's external wallet address to receive currency
  externalWalletAddress: {
    type: String
  },

  // For buys: transaction hash of incoming payment
  incomingTxHash: {
    type: String
  },

  // For sells: transaction hash of outgoing payment
  outgoingTxHash: {
    type: String
  },

  // Admin notes
  adminNotes: {
    type: String
  },

  // Processing admin
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
});

// Indexes
exchangeOrderSchema.index({ userId: 1, createdAt: -1 });
exchangeOrderSchema.index({ status: 1 });
exchangeOrderSchema.index({ currency: 1, status: 1 });

module.exports = mongoose.model('ExchangeOrder', exchangeOrderSchema);
