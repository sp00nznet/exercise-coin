const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const CoinTransfer = require('../models/CoinTransfer');
const TreasureDrop = require('../models/TreasureDrop');
const DropZone = require('../models/DropZone');
const FriendlyTransfer = require('../models/FriendlyTransfer');
const ExerciseSession = require('../models/ExerciseSession');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// ============ Authentication ============

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    admin.lastLoginAt = new Date();
    await admin.save();

    const token = jwt.sign(
      { adminId: admin._id, type: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: admin.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const admin = new Admin({
      email,
      password,
      name,
      role: role || 'admin',
      createdBy: req.adminId
    });

    await admin.save();

    res.status(201).json({ admin: admin.toJSON() });
  } catch (error) {
    next(error);
  }
};

// ============ Dashboard Stats ============

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalUsers,
      activeUsersToday,
      totalTransactions,
      totalTransfers,
      pendingTransfers,
      activeTreasureDrops,
      totalCoinsInCirculation,
      friendlyTransfersThisWeek
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastActiveAt: { $gte: today } }),
      Transaction.countDocuments(),
      CoinTransfer.countDocuments({ status: 'completed' }),
      CoinTransfer.countDocuments({ status: 'pending' }),
      TreasureDrop.countDocuments({ status: 'active' }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$totalCoinsEarned' } } }]),
      FriendlyTransfer.countDocuments({ createdAt: { $gte: weekAgo } })
    ]);

    res.json({
      users: {
        total: totalUsers,
        activeToday: activeUsersToday
      },
      transactions: {
        total: totalTransactions
      },
      transfers: {
        completed: totalTransfers,
        pending: pendingTransfers
      },
      treasure: {
        activeDrops: activeTreasureDrops
      },
      coins: {
        inCirculation: totalCoinsInCirculation[0]?.total || 0
      },
      friendlyTransfers: {
        thisWeek: friendlyTransfersThisWeek
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ Transactions Monitoring ============

exports.getTransactions = async (req, res, next) => {
  try {
    const {
      limit = 50,
      offset = 0,
      type,
      userId,
      startDate,
      endDate,
      status
    } = req.query;

    const query = {};
    if (type) query.type = type;
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('userId', 'username email'),
      Transaction.countDocuments(query)
    ]);

    res.json({
      transactions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ Transfers Monitoring ============

exports.getTransfers = async (req, res, next) => {
  try {
    const {
      limit = 50,
      offset = 0,
      type,
      status,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (type) query.transferType = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [transfers, total] = await Promise.all([
      CoinTransfer.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('fromUserId', 'username email')
        .populate('toUserId', 'username email'),
      CoinTransfer.countDocuments(query)
    ]);

    res.json({
      transfers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ Treasure Drops Monitoring ============

exports.getTreasureDrops = async (req, res, next) => {
  try {
    const {
      limit = 50,
      offset = 0,
      status,
      dropType,
      startDate,
      endDate
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (dropType) query.dropType = dropType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [drops, total] = await Promise.all([
      TreasureDrop.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('droppedBy', 'username')
        .populate('collectedBy', 'username'),
      TreasureDrop.countDocuments(query)
    ]);

    res.json({
      drops,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getTreasureMapData = async (req, res, next) => {
  try {
    const { status = 'active' } = req.query;

    const drops = await TreasureDrop.find({ status })
      .select('location amount dropType locationName status createdAt')
      .limit(500);

    const mapData = drops.map(d => ({
      id: d._id,
      latitude: d.location.coordinates[1],
      longitude: d.location.coordinates[0],
      amount: d.amount,
      dropType: d.dropType,
      locationName: d.locationName,
      status: d.status,
      createdAt: d.createdAt
    }));

    res.json({ drops: mapData });
  } catch (error) {
    next(error);
  }
};

// ============ Reports ============

exports.generateTransactionReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('userId', 'username email')
      .lean();

    if (format === 'csv') {
      const csv = generateTransactionCSV(transactions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transactions_${Date.now()}.csv`);
      return res.send(csv);
    }

    // JSON format
    res.json({
      reportType: 'transactions',
      dateRange: { startDate, endDate },
      totalRecords: transactions.length,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
};

exports.generateTransferReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const query = { status: 'completed' };
    if (startDate || endDate) {
      query.completedAt = {};
      if (startDate) query.completedAt.$gte = new Date(startDate);
      if (endDate) query.completedAt.$lte = new Date(endDate);
    }

    const transfers = await CoinTransfer.find(query)
      .sort({ completedAt: -1 })
      .populate('fromUserId', 'username email')
      .populate('toUserId', 'username email')
      .lean();

    if (format === 'csv') {
      const csv = generateTransferCSV(transfers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=transfers_${Date.now()}.csv`);
      return res.send(csv);
    }

    // JSON format
    res.json({
      reportType: 'transfers',
      dateRange: { startDate, endDate },
      totalRecords: transfers.length,
      totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0),
      data: transfers
    });
  } catch (error) {
    next(error);
  }
};

exports.generateTreasureReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'csv' } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const drops = await TreasureDrop.find(query)
      .sort({ createdAt: -1 })
      .populate('droppedBy', 'username')
      .populate('collectedBy', 'username')
      .lean();

    if (format === 'csv') {
      const csv = generateTreasureCSV(drops);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=treasure_drops_${Date.now()}.csv`);
      return res.send(csv);
    }

    // Summary stats
    const summary = {
      totalDrops: drops.length,
      totalCoinsDropped: drops.reduce((sum, d) => sum + d.amount, 0),
      collected: drops.filter(d => d.status === 'collected').length,
      active: drops.filter(d => d.status === 'active').length,
      expired: drops.filter(d => d.status === 'expired').length,
      byType: {
        user_drop: drops.filter(d => d.dropType === 'user_drop').length,
        random_drop: drops.filter(d => d.dropType === 'random_drop').length,
        event_drop: drops.filter(d => d.dropType === 'event_drop').length
      }
    };

    res.json({
      reportType: 'treasure',
      dateRange: { startDate, endDate },
      summary,
      data: drops
    });
  } catch (error) {
    next(error);
  }
};

// ============ Drop Zones ============

exports.getDropZones = async (req, res, next) => {
  try {
    const zones = await DropZone.find()
      .sort({ priority: -1, createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({ zones });
  } catch (error) {
    next(error);
  }
};

exports.createDropZone = async (req, res, next) => {
  try {
    const {
      name,
      zoneType,
      zipcode,
      polygon,
      center,
      radius,
      priority,
      activeFrom,
      activeTo,
      minDropAmount,
      maxDropAmount
    } = req.body;

    const zone = new DropZone({
      name,
      zoneType,
      zipcode,
      polygon,
      center,
      radius,
      priority,
      activeFrom,
      activeTo,
      minDropAmount,
      maxDropAmount,
      createdBy: req.adminId
    });

    // If zipcode provided, look up approximate center
    if (zoneType === 'zipcode' && zipcode) {
      const coords = await lookupZipcodeCenter(zipcode);
      if (coords) {
        zone.zipcodeCenter = coords;
      }
    }

    await zone.save();

    logger.info(`Admin ${req.adminId} created drop zone: ${name}`);

    res.status(201).json({ zone });
  } catch (error) {
    next(error);
  }
};

exports.updateDropZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const updates = req.body;

    updates.updatedAt = new Date();

    // If updating zipcode, look up new center
    if (updates.zipcode && updates.zoneType === 'zipcode') {
      const coords = await lookupZipcodeCenter(updates.zipcode);
      if (coords) {
        updates.zipcodeCenter = coords;
      }
    }

    const zone = await DropZone.findByIdAndUpdate(zoneId, updates, { new: true });

    if (!zone) {
      return res.status(404).json({ error: 'Drop zone not found' });
    }

    res.json({ zone });
  } catch (error) {
    next(error);
  }
};

exports.deleteDropZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;

    const zone = await DropZone.findByIdAndDelete(zoneId);

    if (!zone) {
      return res.status(404).json({ error: 'Drop zone not found' });
    }

    res.json({ message: 'Drop zone deleted' });
  } catch (error) {
    next(error);
  }
};

// ============ Friendly Transfers ============

exports.getFriendlyTransfers = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, bonusAwarded } = req.query;

    const query = {};
    if (bonusAwarded !== undefined) {
      query.bonusAwarded = bonusAwarded === 'true';
    }

    const [transfers, total] = await Promise.all([
      FriendlyTransfer.find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .populate('fromUserId', 'username')
        .populate('toUserId', 'username'),
      FriendlyTransfer.countDocuments(query)
    ]);

    res.json({
      transfers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============ User Management ============

exports.getUsers = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserDetails = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [user, transactions, transfers, sessions] = await Promise.all([
      User.findById(userId).select('-password'),
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(20),
      CoinTransfer.find({
        $or: [{ fromUserId: userId }, { toUserId: userId }]
      }).sort({ createdAt: -1 }).limit(20),
      ExerciseSession.find({ userId }).sort({ createdAt: -1 }).limit(10).select('-stepData')
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user,
      transactions,
      transfers,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// ============ Helper Functions ============

function generateTransactionCSV(transactions) {
  const headers = ['ID', 'User', 'Email', 'Type', 'Amount', 'Status', 'Created At'];
  const rows = transactions.map(t => [
    t._id,
    t.userId?.username || 'N/A',
    t.userId?.email || 'N/A',
    t.type,
    t.amount,
    t.status,
    new Date(t.createdAt).toISOString()
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateTransferCSV(transfers) {
  const headers = ['ID', 'From User', 'To User', 'Amount', 'Type', 'Status', 'Completed At'];
  const rows = transfers.map(t => [
    t._id,
    t.fromUserId?.username || 'N/A',
    t.toUserId?.username || 'N/A',
    t.amount,
    t.transferType,
    t.status,
    t.completedAt ? new Date(t.completedAt).toISOString() : 'N/A'
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function generateTreasureCSV(drops) {
  const headers = ['ID', 'Amount', 'Type', 'Status', 'Location', 'Dropped By', 'Collected By', 'Created At'];
  const rows = drops.map(d => [
    d._id,
    d.amount,
    d.dropType,
    d.status,
    d.locationName || `${d.location?.coordinates?.[1]}, ${d.location?.coordinates?.[0]}`,
    d.droppedBy?.username || 'System',
    d.collectedBy?.username || 'N/A',
    new Date(d.createdAt).toISOString()
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Simple zipcode to coordinates lookup (in production, use a geocoding API)
async function lookupZipcodeCenter(zipcode) {
  // This is a simplified lookup - in production, use Google Geocoding, Mapbox, or similar
  const zipcodeData = {
    '10001': { latitude: 40.7484, longitude: -73.9967 }, // NYC
    '90210': { latitude: 34.0901, longitude: -118.4065 }, // Beverly Hills
    '60601': { latitude: 41.8819, longitude: -87.6278 }, // Chicago
    '94102': { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
    '98101': { latitude: 47.6062, longitude: -122.3321 }, // Seattle
    '80202': { latitude: 39.7392, longitude: -104.9903 }, // Denver
    '85001': { latitude: 33.4484, longitude: -112.0740 }, // Phoenix
    '77001': { latitude: 29.7604, longitude: -95.3698 }, // Houston
    '33101': { latitude: 25.7617, longitude: -80.1918 }, // Miami
    '02101': { latitude: 42.3601, longitude: -71.0589 }, // Boston
  };

  return zipcodeData[zipcode] || null;
}

module.exports = exports;
