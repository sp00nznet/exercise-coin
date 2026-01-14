import React, { useState, useEffect } from 'react';
import adminApi from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getDashboardStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="card">
          <div className="card-title">Total Users</div>
          <div className="card-value">{stats?.totalUsers || 0}</div>
        </div>

        <div className="card">
          <div className="card-title">Total Coins Mined</div>
          <div className="card-value">{stats?.totalCoinsMined?.toFixed(2) || '0.00'}</div>
        </div>

        <div className="card">
          <div className="card-title">Total Transactions</div>
          <div className="card-value">{stats?.totalTransactions || 0}</div>
        </div>

        <div className="card">
          <div className="card-title">Active Treasure Drops</div>
          <div className="card-value">{stats?.activeTreasureDrops || 0}</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card">
          <div className="card-title">Total Transfers</div>
          <div className="card-value">{stats?.totalTransfers || 0}</div>
        </div>

        <div className="card">
          <div className="card-title">Friendly Transfers (This Week)</div>
          <div className="card-value">{stats?.friendlyTransfersThisWeek || 0}</div>
        </div>

        <div className="card">
          <div className="card-title">Active Drop Zones</div>
          <div className="card-value">{stats?.activeDropZones || 0}</div>
        </div>

        <div className="card">
          <div className="card-title">Total Exercise Sessions</div>
          <div className="card-value">{stats?.totalExerciseSessions || 0}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Recent Activity</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>User</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats?.recentTransactions?.map((tx) => (
              <tr key={tx._id}>
                <td>{new Date(tx.createdAt).toLocaleString()}</td>
                <td>{tx.type}</td>
                <td>{tx.userId?.username || 'N/A'}</td>
                <td>{tx.amount.toFixed(4)} EXC</td>
                <td>
                  <span className={`badge badge-${tx.status === 'confirmed' ? 'success' : 'pending'}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
