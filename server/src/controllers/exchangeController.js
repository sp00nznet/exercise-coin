const ExchangeWallet = require('../models/ExchangeWallet');
const ExchangeOrder = require('../models/ExchangeOrder');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');
const { TOKENOMICS } = require('../config/tokenomics');

/**
 * 💱 Exchange Controller
 *
 * Handles cryptocurrency exchange operations between EXC and other currencies.
 */
const exchangeController = {
  /**
   * Get all available currencies for trading
   */
  async getCurrencies(req, res) {
    try {
      const wallets = await ExchangeWallet.find({ isEnabled: true })
        .select('-address -platformBalance')
        .sort({ currency: 1 });

      res.json({
        success: true,
        currencies: wallets.map(w => ({
          currency: w.currency,
          name: w.name,
          type: w.currencyType,
          exchangeRate: w.exchangeRate,
          rateUpdatedAt: w.rateUpdatedAt,
          minTradeAmount: w.minTradeAmount,
          maxTradeAmount: w.maxTradeAmount,
          iconUrl: w.iconUrl,
          decimals: w.decimals,
          notes: w.notes
        }))
      });
    } catch (error) {
      logger.error('Error getting currencies:', error);
      res.status(500).json({ error: 'Failed to get currencies' });
    }
  },

  /**
   * Get exchange rate for a specific currency
   */
  async getRate(req, res) {
    try {
      const { currency } = req.params;

      const wallet = await ExchangeWallet.findOne({
        currency: currency.toUpperCase(),
        isEnabled: true
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Currency not supported' });
      }

      res.json({
        success: true,
        currency: wallet.currency,
        name: wallet.name,
        exchangeRate: wallet.exchangeRate,
        rateUpdatedAt: wallet.rateUpdatedAt,
        // 1 EXC = X currency
        excTo: wallet.exchangeRate,
        // X currency = 1 EXC
        toExc: wallet.exchangeRate > 0 ? 1 / wallet.exchangeRate : 0
      });
    } catch (error) {
      logger.error('Error getting rate:', error);
      res.status(500).json({ error: 'Failed to get exchange rate' });
    }
  },

  /**
   * Create a sell order (user sells EXC for another currency)
   */
  async createSellOrder(req, res) {
    try {
      const { currency, excAmount, externalWalletAddress } = req.body;
      const userId = req.user.id;

      // Validate inputs
      if (!currency || !excAmount || !externalWalletAddress) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get currency wallet and rate
      const wallet = await ExchangeWallet.findOne({
        currency: currency.toUpperCase(),
        isEnabled: true
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Currency not supported for trading' });
      }

      // Check limits
      if (excAmount < wallet.minTradeAmount) {
        return res.status(400).json({ error: `Minimum trade amount is ${wallet.minTradeAmount} EXC` });
      }

      if (excAmount > wallet.maxTradeAmount) {
        return res.status(400).json({ error: `Maximum trade amount is ${wallet.maxTradeAmount} EXC` });
      }

      // Check user balance
      const user = await User.findById(userId);
      if (!user || user.totalCoinsEarned < excAmount) {
        return res.status(400).json({ error: 'Insufficient EXC balance' });
      }

      // Calculate amounts
      const fee = excAmount * (TOKENOMICS.EXCHANGE.TRADE_FEE_PERCENT / 100);
      const netExcAmount = excAmount - fee;
      const currencyAmount = netExcAmount * wallet.exchangeRate;

      // Deduct EXC from user
      await User.findByIdAndUpdate(userId, {
        $inc: { totalCoinsEarned: -excAmount }
      });

      // Create order
      const order = await ExchangeOrder.create({
        userId,
        orderType: 'sell',
        currency: wallet.currency,
        excAmount,
        currencyAmount,
        exchangeRate: wallet.exchangeRate,
        fee,
        externalWalletAddress,
        status: 'pending'
      });

      // Create transaction record
      await Transaction.create({
        userId,
        type: 'transfer_out',
        amount: -excAmount,
        status: 'pending',
        metadata: {
          type: 'exchange_sell',
          orderId: order._id,
          currency: wallet.currency,
          currencyAmount,
          exchangeRate: wallet.exchangeRate,
          fee
        }
      });

      logger.info(`Exchange sell order created: ${excAmount} EXC -> ${currencyAmount} ${wallet.currency}`);

      res.json({
        success: true,
        order: {
          id: order._id,
          type: 'sell',
          excAmount,
          currencyAmount,
          currency: wallet.currency,
          exchangeRate: wallet.exchangeRate,
          fee,
          status: 'pending',
          externalWallet: externalWalletAddress,
          message: 'Order placed! Admin will process your withdrawal soon.'
        }
      });
    } catch (error) {
      logger.error('Error creating sell order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  /**
   * Create a buy order (user buys EXC with another currency)
   */
  async createBuyOrder(req, res) {
    try {
      const { currency, excAmount } = req.body;
      const userId = req.user.id;

      // Validate inputs
      if (!currency || !excAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get currency wallet and rate
      const wallet = await ExchangeWallet.findOne({
        currency: currency.toUpperCase(),
        isEnabled: true
      });

      if (!wallet) {
        return res.status(404).json({ error: 'Currency not supported for trading' });
      }

      // Check limits
      if (excAmount < wallet.minTradeAmount) {
        return res.status(400).json({ error: `Minimum trade amount is ${wallet.minTradeAmount} EXC` });
      }

      if (excAmount > wallet.maxTradeAmount) {
        return res.status(400).json({ error: `Maximum trade amount is ${wallet.maxTradeAmount} EXC` });
      }

      // Calculate amounts
      const currencyAmount = excAmount * wallet.exchangeRate;
      const fee = excAmount * (TOKENOMICS.EXCHANGE.TRADE_FEE_PERCENT / 100);

      // Create order (pending payment)
      const order = await ExchangeOrder.create({
        userId,
        orderType: 'buy',
        currency: wallet.currency,
        excAmount,
        currencyAmount,
        exchangeRate: wallet.exchangeRate,
        fee,
        status: 'pending'
      });

      logger.info(`Exchange buy order created: ${currencyAmount} ${wallet.currency} -> ${excAmount} EXC`);

      res.json({
        success: true,
        order: {
          id: order._id,
          type: 'buy',
          excAmount,
          currencyAmount,
          currency: wallet.currency,
          exchangeRate: wallet.exchangeRate,
          fee,
          status: 'pending',
          paymentAddress: wallet.address,
          paymentAmount: currencyAmount,
          message: `Send ${currencyAmount.toFixed(wallet.decimals)} ${wallet.currency} to the address below. Your EXC will be credited after confirmation.`
        }
      });
    } catch (error) {
      logger.error('Error creating buy order:', error);
      res.status(500).json({ error: 'Failed to create order' });
    }
  },

  /**
   * Get user's order history
   */
  async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const { status, limit = 20, offset = 0 } = req.query;

      const query = { userId };
      if (status) query.status = status;

      const [orders, total] = await Promise.all([
        ExchangeOrder.find(query)
          .sort({ createdAt: -1 })
          .skip(parseInt(offset))
          .limit(parseInt(limit)),
        ExchangeOrder.countDocuments(query)
      ]);

      res.json({
        success: true,
        orders: orders.map(o => ({
          id: o._id,
          type: o.orderType,
          currency: o.currency,
          excAmount: o.excAmount,
          currencyAmount: o.currencyAmount,
          exchangeRate: o.exchangeRate,
          fee: o.fee,
          status: o.status,
          createdAt: o.createdAt,
          completedAt: o.completedAt
        })),
        total,
        hasMore: offset + orders.length < total
      });
    } catch (error) {
      logger.error('Error getting orders:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  },

  /**
   * Cancel a pending order
   */
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const order = await ExchangeOrder.findOne({
        _id: orderId,
        userId,
        status: 'pending'
      });

      if (!order) {
        return res.status(404).json({ error: 'Order not found or cannot be cancelled' });
      }

      // If it was a sell order, refund the EXC
      if (order.orderType === 'sell') {
        await User.findByIdAndUpdate(userId, {
          $inc: { totalCoinsEarned: order.excAmount }
        });

        // Update transaction
        await Transaction.updateOne(
          { 'metadata.orderId': order._id },
          { $set: { status: 'cancelled', amount: 0 } }
        );
      }

      order.status = 'cancelled';
      await order.save();

      logger.info(`Exchange order cancelled: ${orderId}`);

      res.json({
        success: true,
        message: order.orderType === 'sell'
          ? 'Order cancelled. EXC has been refunded to your wallet.'
          : 'Order cancelled.'
      });
    } catch (error) {
      logger.error('Error cancelling order:', error);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  },

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all wallets (admin only)
   */
  async adminGetWallets(req, res) {
    try {
      const wallets = await ExchangeWallet.find().sort({ currency: 1 });
      res.json({ success: true, wallets });
    } catch (error) {
      logger.error('Error getting wallets:', error);
      res.status(500).json({ error: 'Failed to get wallets' });
    }
  },

  /**
   * Create or update a wallet (admin only)
   */
  async adminUpsertWallet(req, res) {
    try {
      const { currency, name, address, currencyType, network, exchangeRate, isEnabled, minTradeAmount, maxTradeAmount, iconUrl, decimals, notes, platformBalance } = req.body;

      if (!currency || !name || !address || !currencyType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const wallet = await ExchangeWallet.findOneAndUpdate(
        { currency: currency.toUpperCase() },
        {
          currency: currency.toUpperCase(),
          name,
          address,
          currencyType,
          network,
          exchangeRate: exchangeRate || 0,
          isEnabled: isEnabled !== false,
          minTradeAmount: minTradeAmount || 1,
          maxTradeAmount: maxTradeAmount || 10000,
          iconUrl,
          decimals: decimals || 8,
          notes,
          platformBalance: platformBalance || 0,
          rateUpdatedAt: new Date()
        },
        { upsert: true, new: true }
      );

      logger.info(`Exchange wallet updated: ${currency}`);

      res.json({ success: true, wallet });
    } catch (error) {
      logger.error('Error upserting wallet:', error);
      res.status(500).json({ error: 'Failed to save wallet' });
    }
  },

  /**
   * Update exchange rate (admin only)
   */
  async adminUpdateRate(req, res) {
    try {
      const { currency } = req.params;
      const { exchangeRate } = req.body;

      if (typeof exchangeRate !== 'number' || exchangeRate < 0) {
        return res.status(400).json({ error: 'Invalid exchange rate' });
      }

      const wallet = await ExchangeWallet.findOneAndUpdate(
        { currency: currency.toUpperCase() },
        { exchangeRate, rateUpdatedAt: new Date() },
        { new: true }
      );

      if (!wallet) {
        return res.status(404).json({ error: 'Currency not found' });
      }

      logger.info(`Exchange rate updated: ${currency} = ${exchangeRate}`);

      res.json({ success: true, wallet });
    } catch (error) {
      logger.error('Error updating rate:', error);
      res.status(500).json({ error: 'Failed to update rate' });
    }
  },

  /**
   * Get all orders (admin only)
   */
  async adminGetOrders(req, res) {
    try {
      const { status, currency, limit = 50, offset = 0 } = req.query;

      const query = {};
      if (status) query.status = status;
      if (currency) query.currency = currency.toUpperCase();

      const [orders, total] = await Promise.all([
        ExchangeOrder.find(query)
          .populate('userId', 'username email')
          .populate('processedBy', 'name')
          .sort({ createdAt: -1 })
          .skip(parseInt(offset))
          .limit(parseInt(limit)),
        ExchangeOrder.countDocuments(query)
      ]);

      res.json({ success: true, orders, total });
    } catch (error) {
      logger.error('Error getting admin orders:', error);
      res.status(500).json({ error: 'Failed to get orders' });
    }
  },

  /**
   * Process an order (admin only)
   */
  async adminProcessOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { action, txHash, adminNotes } = req.body;
      const adminId = req.admin.id;

      const order = await ExchangeOrder.findById(orderId).populate('userId', 'username email');
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status !== 'pending' && order.status !== 'processing') {
        return res.status(400).json({ error: 'Order cannot be processed' });
      }

      if (action === 'complete') {
        // Complete the order
        if (order.orderType === 'buy') {
          // Credit EXC to user
          await User.findByIdAndUpdate(order.userId, {
            $inc: { totalCoinsEarned: order.excAmount - order.fee }
          });

          // Create transaction
          await Transaction.create({
            userId: order.userId._id || order.userId,
            type: 'transfer_in',
            amount: order.excAmount - order.fee,
            status: 'confirmed',
            confirmedAt: new Date(),
            metadata: {
              type: 'exchange_buy',
              orderId: order._id,
              currency: order.currency,
              currencyAmount: order.currencyAmount
            }
          });
        } else {
          // Update sell transaction to confirmed
          await Transaction.updateOne(
            { 'metadata.orderId': order._id },
            { $set: { status: 'confirmed', confirmedAt: new Date() } }
          );
        }

        order.status = 'completed';
        order.completedAt = new Date();
        if (txHash) order.outgoingTxHash = txHash;
      } else if (action === 'fail') {
        // Fail the order
        if (order.orderType === 'sell') {
          // Refund EXC
          await User.findByIdAndUpdate(order.userId, {
            $inc: { totalCoinsEarned: order.excAmount }
          });

          await Transaction.updateOne(
            { 'metadata.orderId': order._id },
            { $set: { status: 'failed', amount: 0 } }
          );
        }

        order.status = 'failed';
      } else if (action === 'process') {
        order.status = 'processing';
      } else {
        return res.status(400).json({ error: 'Invalid action' });
      }

      order.processedBy = adminId;
      order.processedAt = new Date();
      if (adminNotes) order.adminNotes = adminNotes;

      await order.save();

      logger.info(`Exchange order ${action}ed: ${orderId} by admin ${adminId}`);

      res.json({ success: true, order });
    } catch (error) {
      logger.error('Error processing order:', error);
      res.status(500).json({ error: 'Failed to process order' });
    }
  },

  /**
   * Delete a wallet (admin only)
   */
  async adminDeleteWallet(req, res) {
    try {
      const { currency } = req.params;

      // Check for pending orders
      const pendingOrders = await ExchangeOrder.countDocuments({
        currency: currency.toUpperCase(),
        status: { $in: ['pending', 'processing'] }
      });

      if (pendingOrders > 0) {
        return res.status(400).json({
          error: `Cannot delete: ${pendingOrders} pending orders exist for this currency`
        });
      }

      await ExchangeWallet.deleteOne({ currency: currency.toUpperCase() });

      logger.info(`Exchange wallet deleted: ${currency}`);

      res.json({ success: true, message: 'Wallet deleted' });
    } catch (error) {
      logger.error('Error deleting wallet:', error);
      res.status(500).json({ error: 'Failed to delete wallet' });
    }
  }
};

module.exports = exchangeController;
