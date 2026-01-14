import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import './UserDetail.css';

function UserDetail({ apiKey }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch user');

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading user details...</div>;
  }

  if (!data || !data.user) {
    return <div className="error">User not found</div>;
  }

  const { user, daemonStatus, recentSessions, recentTransactions, sessionStats } = data;

  const sessionColumns = [
    {
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString()
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status}`}>{row.status}</span>
      )
    },
    { header: 'Steps', render: (row) => row.totalSteps?.toLocaleString() },
    {
      header: 'Duration',
      render: (row) => `${Math.floor((row.durationSeconds || 0) / 60)}m`
    },
    {
      header: 'Coins',
      render: (row) => row.coinsEarned ? `+${row.coinsEarned.toFixed(2)}` : '-'
    }
  ];

  const txColumns = [
    {
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString()
    },
    { header: 'Type', render: (row) => row.type.replace('_', ' ') },
    {
      header: 'Amount',
      render: (row) => (
        <span style={{ color: '#4ade80' }}>+{row.amount.toFixed(4)} EXC</span>
      )
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status}`}>{row.status}</span>
      )
    }
  ];

  return (
    <div className="user-detail">
      <button className="back-btn" onClick={() => navigate('/users')}>
        ← Back to Users
      </button>

      <div className="user-header">
        <div className="user-avatar">
          {user.username?.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <h2>{user.username}</h2>
          <p>{user.email}</p>
          <span className={`status-badge ${daemonStatus?.status || 'inactive'}`}>
            Daemon: {daemonStatus?.status || 'inactive'}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Coins Earned"
          value={(user.totalCoinsEarned || 0).toFixed(2)}
          icon="💰"
          color="accent"
        />
        <StatCard
          title="Total Steps"
          value={(user.totalSteps || 0).toLocaleString()}
          icon="👟"
        />
        <StatCard
          title="Exercise Time"
          value={`${Math.round((user.totalExerciseSeconds || 0) / 3600)}h`}
          icon="⏱️"
        />
        <StatCard
          title="Mining Time"
          value={`${Math.round((user.totalMiningSeconds || 0) / 60)}m`}
          icon="⛏️"
        />
      </div>

      <div className="detail-section">
        <h3>Account Details</h3>
        <div className="details-grid">
          <div className="detail-item">
            <span className="label">User ID</span>
            <span className="value">{user._id}</span>
          </div>
          <div className="detail-item">
            <span className="label">Wallet Address</span>
            <span className="value mono">{user.walletAddress || 'Not generated'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Daemon Port</span>
            <span className="value">{user.daemonPort || 'N/A'}</span>
          </div>
          <div className="detail-item">
            <span className="label">Joined</span>
            <span className="value">{new Date(user.createdAt).toLocaleString()}</span>
          </div>
          <div className="detail-item">
            <span className="label">Last Active</span>
            <span className="value">
              {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {sessionStats && sessionStats.length > 0 && (
        <div className="detail-section">
          <h3>Session Statistics</h3>
          <div className="session-stats">
            {sessionStats.map(stat => (
              <div key={stat._id} className="session-stat">
                <span className={`status-badge ${stat._id}`}>{stat._id}</span>
                <span className="count">{stat.count} sessions</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="detail-section">
        <h3>Recent Sessions</h3>
        <DataTable
          columns={sessionColumns}
          data={recentSessions}
          emptyMessage="No sessions yet"
        />
      </div>

      <div className="detail-section">
        <h3>Recent Transactions</h3>
        <DataTable
          columns={txColumns}
          data={recentTransactions}
          emptyMessage="No transactions yet"
        />
      </div>
    </div>
  );
}

export default UserDetail;
