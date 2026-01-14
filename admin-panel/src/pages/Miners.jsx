import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import './Miners.css';

function Miners({ apiKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMiners();
    const interval = setInterval(fetchMiners, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMiners = async () => {
    try {
      const res = await fetch('/api/admin/miners', {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch miners');

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { header: 'Username', key: 'username' },
    { header: 'Email', key: 'email' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status}`}>{row.status}</span>
      )
    },
    {
      header: 'Mining',
      render: (row) => (
        <span className={`mining-indicator ${row.miningActive ? 'active' : ''}`}>
          {row.miningActive ? '⛏️ Mining' : 'Idle'}
        </span>
      )
    },
    { header: 'Port', key: 'port' },
    {
      header: 'Total Earned',
      render: (row) => `${row.totalCoinsEarned.toFixed(2)} EXC`
    },
    {
      header: 'Started',
      render: (row) => row.startedAt
        ? new Date(row.startedAt).toLocaleString()
        : '-'
    }
  ];

  if (loading) {
    return <div className="loading">Loading miners...</div>;
  }

  return (
    <div className="miners-page">
      <div className="miners-header">
        <h2>Active Mining Daemons</h2>
        <span className="refresh-note">Auto-refreshes every 10s</span>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Active Daemons"
          value={data?.total || 0}
          icon="🖥️"
          color="accent"
        />
        <StatCard
          title="Currently Mining"
          value={data?.currentlyMining || 0}
          icon="⛏️"
          color="success"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.miners || []}
        emptyMessage="No active miners"
      />

      {data?.miners?.some(m => m.miningActive) && (
        <div className="active-mining-section">
          <h3>Currently Mining</h3>
          <div className="mining-cards">
            {data.miners.filter(m => m.miningActive).map(miner => (
              <div key={miner.userId} className="mining-card">
                <div className="mining-card-header">
                  <span className="username">{miner.username}</span>
                  <span className="mining-badge">⛏️ Mining</span>
                </div>
                <div className="mining-card-details">
                  <div className="detail">
                    <span className="label">Started</span>
                    <span className="value">
                      {miner.miningStartedAt
                        ? new Date(miner.miningStartedAt).toLocaleTimeString()
                        : '-'}
                    </span>
                  </div>
                  <div className="detail">
                    <span className="label">Duration</span>
                    <span className="value">{miner.miningDuration || 0}s</span>
                  </div>
                  <div className="detail">
                    <span className="label">Port</span>
                    <span className="value">{miner.port}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Miners;
