const mongoose = require('mongoose');

/**
 * 💱 Exchange Wallet
 *
 * Admin-controlled wallet addresses for each supported currency.
 * These are the platform's exchange wallets where users send funds.
 */
const exchangeWalletSchema = new mongoose.Schema({
  // Currency code (BTC, ETH, LTC, USD, etc.)
  currency: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },

  // Display name
  name: {
    type: String,
    required: true
  },

  // Wallet address (for crypto) or account info (for fiat)
  address: {
    type: String,
    required: true
  },

  // Currency type
  currencyType: {
    type: String,
    enum: ['crypto', 'fiat'],
    required: true
  },

  // For crypto: network (e.g., 'mainnet', 'ethereum', 'polygon')
  network: {
    type: String
  },

  // Current exchange rate (1 EXC = X of this currency)
  exchangeRate: {
    type: Number,
    required: true,
    default: 0
  },

  // Last rate update
  rateUpdatedAt: {
    type: Date,
    default: Date.now
  },

  // Is trading enabled for this currency?
  isEnabled: {
    type: Boolean,
    default: true
  },

  // Minimum/maximum trade amounts (in EXC)
  minTradeAmount: {
    type: Number,
    default: 1
  },
  maxTradeAmount: {
    type: Number,
    default: 10000
  },

  // Platform balance in this currency (for display)
  platformBalance: {
    type: Number,
    default: 0
  },

  // Icon/logo URL
  iconUrl: {
    type: String
  },

  // Decimal places for this currency
  decimals: {
    type: Number,
    default: 8
  },

  // Additional notes (shown to users)
  notes: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

exchangeWalletSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ExchangeWallet', exchangeWalletSchema);
