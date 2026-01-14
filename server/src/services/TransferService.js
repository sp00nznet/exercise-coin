const CoinTransfer = require('../models/CoinTransfer');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class TransferService {
  /**
   * Send coins directly to another user by username
   */
  static async sendToUser(fromUserId, toUsername, amount, message = '') {
    try {
      // Find recipient
      const recipient = await User.findOne({ username: toUsername });
      if (!recipient) {
        return { success: false, error: 'User not found' };
      }

      if (recipient._id.toString() === fromUserId) {
        return { success: false, error: 'Cannot send coins to yourself' };
      }

      // Check sender has enough coins
      const sender = await User.findById(fromUserId);
      if (!sender) {
        return { success: false, error: 'Sender not found' };
      }

      if (sender.totalCoinsEarned < amount) {
        return { success: false, error: 'Insufficient coins' };
      }

      // Perform the transfer
      await User.findByIdAndUpdate(fromUserId, {
        $inc: { totalCoinsEarned: -amount }
      });

      await User.findByIdAndUpdate(recipient._id, {
        $inc: { totalCoinsEarned: amount }
      });

      // Create transfer record
      const transfer = await CoinTransfer.create({
        fromUserId,
        toUserId: recipient._id,
        amount,
        transferType: 'direct',
        message,
        status: 'completed',
        completedAt: new Date()
      });

      // Create transaction records for both users
      await Transaction.create({
        userId: fromUserId,
        type: 'transfer_out',
        amount: -amount,
        status: 'confirmed',
        confirmedAt: new Date(),
        metadata: {
          type: 'user_transfer',
          transferId: transfer._id,
          toUser: recipient.username
        }
      });

      await Transaction.create({
        userId: recipient._id,
        type: 'transfer_in',
        amount,
        status: 'confirmed',
        confirmedAt: new Date(),
        metadata: {
          type: 'user_transfer',
          transferId: transfer._id,
          fromUser: sender.username
        }
      });

      logger.info(`User ${fromUserId} sent ${amount} coins to ${toUsername}`);

      return {
        success: true,
        transfer: {
          id: transfer._id,
          amount,
          toUsername: recipient.username,
          message
        }
      };
    } catch (error) {
      logger.error('Error sending coins:', error);
      return { success: false, error: 'Failed to send coins' };
    }
  }

  /**
   * Create a QR code transfer (coins are held until claimed)
   */
  static async createQRTransfer(fromUserId, amount, message = '', expiresInHours = 24) {
    try {
      // Check sender has enough coins
      const sender = await User.findById(fromUserId);
      if (!sender) {
        return { success: false, error: 'User not found' };
      }

      if (sender.totalCoinsEarned < amount) {
        return { success: false, error: 'Insufficient coins' };
      }

      // Deduct coins from sender (held in escrow)
      await User.findByIdAndUpdate(fromUserId, {
        $inc: { totalCoinsEarned: -amount }
      });

      // Create the QR transfer
      const transfer = await CoinTransfer.create({
        fromUserId,
        amount,
        transferType: 'qr_code',
        message,
        status: 'pending',
        expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      });

      // Create pending transaction
      await Transaction.create({
        userId: fromUserId,
        type: 'transfer_out',
        amount: -amount,
        status: 'pending',
        metadata: {
          type: 'qr_transfer',
          transferId: transfer._id
        }
      });

      logger.info(`User ${fromUserId} created QR transfer for ${amount} coins`);

      return {
        success: true,
        transfer: {
          id: transfer._id,
          claimCode: transfer.claimCode,
          amount,
          message,
          expiresAt: transfer.expiresAt,
          // QR data to encode
          qrData: JSON.stringify({
            type: 'exc_transfer',
            code: transfer.claimCode,
            amount
          })
        }
      };
    } catch (error) {
      logger.error('Error creating QR transfer:', error);
      return { success: false, error: 'Failed to create QR transfer' };
    }
  }

  /**
   * Claim a QR code transfer
   */
  static async claimQRTransfer(claimUserId, claimCode) {
    try {
      // Find the transfer
      const transfer = await CoinTransfer.findOne({ claimCode });

      if (!transfer) {
        return { success: false, error: 'Invalid transfer code' };
      }

      if (transfer.status !== 'pending') {
        return { success: false, error: 'Transfer already claimed or expired' };
      }

      if (transfer.expiresAt && transfer.expiresAt < new Date()) {
        // Mark as expired and refund
        await this.expireQRTransfer(transfer);
        return { success: false, error: 'Transfer has expired' };
      }

      if (transfer.fromUserId.toString() === claimUserId) {
        return { success: false, error: 'Cannot claim your own transfer' };
      }

      // Complete the transfer
      transfer.toUserId = claimUserId;
      transfer.status = 'completed';
      transfer.completedAt = new Date();
      await transfer.save();

      // Add coins to recipient
      await User.findByIdAndUpdate(claimUserId, {
        $inc: { totalCoinsEarned: transfer.amount }
      });

      // Update sender's transaction to confirmed
      await Transaction.updateOne(
        {
          userId: transfer.fromUserId,
          'metadata.transferId': transfer._id
        },
        {
          $set: { status: 'confirmed', confirmedAt: new Date() }
        }
      );

      // Create recipient's transaction
      const sender = await User.findById(transfer.fromUserId);
      await Transaction.create({
        userId: claimUserId,
        type: 'transfer_in',
        amount: transfer.amount,
        status: 'confirmed',
        confirmedAt: new Date(),
        metadata: {
          type: 'qr_transfer',
          transferId: transfer._id,
          fromUser: sender?.username || 'Unknown'
        }
      });

      logger.info(`User ${claimUserId} claimed QR transfer ${transfer._id} for ${transfer.amount} coins`);

      return {
        success: true,
        amount: transfer.amount,
        message: transfer.message,
        fromUsername: sender?.username || 'Unknown'
      };
    } catch (error) {
      logger.error('Error claiming QR transfer:', error);
      return { success: false, error: 'Failed to claim transfer' };
    }
  }

  /**
   * Cancel a pending QR transfer (refund to sender)
   */
  static async cancelQRTransfer(userId, transferId) {
    try {
      const transfer = await CoinTransfer.findOne({
        _id: transferId,
        fromUserId: userId,
        status: 'pending'
      });

      if (!transfer) {
        return { success: false, error: 'Transfer not found or cannot be cancelled' };
      }

      // Mark as cancelled
      transfer.status = 'cancelled';
      await transfer.save();

      // Refund coins to sender
      await User.findByIdAndUpdate(userId, {
        $inc: { totalCoinsEarned: transfer.amount }
      });

      // Update transaction
      await Transaction.updateOne(
        {
          userId,
          'metadata.transferId': transfer._id
        },
        {
          $set: {
            status: 'cancelled',
            amount: 0
          }
        }
      );

      logger.info(`User ${userId} cancelled QR transfer ${transferId}`);

      return { success: true, refundedAmount: transfer.amount };
    } catch (error) {
      logger.error('Error cancelling QR transfer:', error);
      return { success: false, error: 'Failed to cancel transfer' };
    }
  }

  /**
   * Expire a QR transfer and refund to sender
   */
  static async expireQRTransfer(transfer) {
    try {
      transfer.status = 'expired';
      await transfer.save();

      // Refund coins to sender
      await User.findByIdAndUpdate(transfer.fromUserId, {
        $inc: { totalCoinsEarned: transfer.amount }
      });

      // Update transaction
      await Transaction.updateOne(
        {
          userId: transfer.fromUserId,
          'metadata.transferId': transfer._id
        },
        {
          $set: {
            status: 'expired',
            amount: 0
          }
        }
      );

      logger.info(`QR transfer ${transfer._id} expired, refunded ${transfer.amount} coins`);

      return { success: true };
    } catch (error) {
      logger.error('Error expiring QR transfer:', error);
      return { success: false };
    }
  }

  /**
   * Get user's pending QR transfers
   */
  static async getPendingTransfers(userId) {
    try {
      const transfers = await CoinTransfer.find({
        fromUserId: userId,
        transferType: 'qr_code',
        status: 'pending'
      }).sort({ createdAt: -1 });

      return {
        success: true,
        transfers: transfers.map(t => ({
          id: t._id,
          claimCode: t.claimCode,
          amount: t.amount,
          message: t.message,
          expiresAt: t.expiresAt,
          createdAt: t.createdAt,
          qrData: JSON.stringify({
            type: 'exc_transfer',
            code: t.claimCode,
            amount: t.amount
          })
        }))
      };
    } catch (error) {
      logger.error('Error getting pending transfers:', error);
      return { success: false, transfers: [] };
    }
  }

  /**
   * Get transfer history for a user
   */
  static async getTransferHistory(userId, limit = 20) {
    try {
      const transfers = await CoinTransfer.find({
        $or: [{ fromUserId: userId }, { toUserId: userId }],
        status: 'completed'
      })
      .sort({ completedAt: -1 })
      .limit(limit)
      .populate('fromUserId', 'username')
      .populate('toUserId', 'username');

      return {
        success: true,
        transfers: transfers.map(t => ({
          id: t._id,
          type: t.fromUserId._id.toString() === userId ? 'sent' : 'received',
          amount: t.amount,
          otherUser: t.fromUserId._id.toString() === userId
            ? t.toUserId?.username
            : t.fromUserId?.username,
          transferType: t.transferType,
          message: t.message,
          completedAt: t.completedAt
        }))
      };
    } catch (error) {
      logger.error('Error getting transfer history:', error);
      return { success: false, transfers: [] };
    }
  }

  /**
   * Clean up expired pending transfers
   */
  static async cleanupExpiredTransfers() {
    try {
      const expiredTransfers = await CoinTransfer.find({
        status: 'pending',
        expiresAt: { $lt: new Date() }
      });

      for (const transfer of expiredTransfers) {
        await this.expireQRTransfer(transfer);
      }

      if (expiredTransfers.length > 0) {
        logger.info(`Cleaned up ${expiredTransfers.length} expired QR transfers`);
      }

      return { success: true, expiredCount: expiredTransfers.length };
    } catch (error) {
      logger.error('Error cleaning up expired transfers:', error);
      return { success: false };
    }
  }
}

module.exports = TransferService;
