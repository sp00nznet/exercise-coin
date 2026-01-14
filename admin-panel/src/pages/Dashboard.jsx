import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import './Dashboard.css';

function Dashboard({ apiKey }) {
  const [data, setData] = useState(null);
  const [miningData, setMiningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [apiKey]);

  const fetchData = async () => {
    try {
      const [dashRes, miningRes] = await Promise.all([
        fetch('/api/admin/dashboard', { headers: { 'X-Admin-Key': apiKey } }),
        fetch('/api/admin/mining/metrics?period=7d', { headers: { 'X-Admin-Key': apiKey } })
      ]);

      if (!dashRes.ok || !miningRes.ok) throw new Error('Failed to fetch data');

      const dashboard = await dashRes.json();
      const mining = await miningRes.json();

      setData(dashboard);
      setMiningData(mining);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>System Overview</h2>
        <span className="last-updated">
          Last updated: {new Date(data.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={data.users.total.toLocaleString()}
          subtitle={`${data.users.newToday} new today`}
          icon="👥"
          color="accent"
        />
        <StatCard
          title="Active Today"
          value={data.users.activeToday.toLocaleString()}
          subtitle={`${data.users.activeWeek} this week`}
          icon="📱"
        />
        <StatCard
          title="Active Miners"
          value={data.mining.activeDaemons}
          subtitle={`${data.mining.currentlyMining} mining now`}
          icon="⛏️"
          color="success"
        />
        <StatCard
          title="Coins Distributed"
          value={data.mining.totalCoinsDistributed.toFixed(2)}
          subtitle={`${data.mining.coinsDistributedToday.toFixed(2)} today`}
          icon="💰"
          color="warning"
        />
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Sessions"
          value={data.sessions.total.toLocaleString()}
          subtitle={`${data.sessions.today} today`}
          icon="🏃"
        />
        <StatCard
          title="Rewarded Sessions"
          value={data.sessions.rewarded.toLocaleString()}
          subtitle={`${data.sessions.successRate}% success rate`}
          icon="🎉"
          color="success"
        />
        <StatCard
          title="Exercise Time"
          value={`${data.exercise.totalTimeHours.toLocaleString()}h`}
          subtitle="Total tracked"
          icon="⏱️"
        />
        <StatCard
          title="Total Steps"
          value={formatLargeNumber(data.exercise.totalSteps)}
          subtitle="All time"
          icon="👟"
        />
      </div>

      {miningData && miningData.dailyStats.length > 0 && (
        <div className="chart-section">
          <h3>Mining Activity (Last 7 Days)</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={miningData.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis
                  dataKey="_id"
                  stroke="#888"
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a4a',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="totalCoins"
                  stroke="#e94560"
                  strokeWidth={2}
                  dot={{ fill: '#e94560' }}
                  name="Coins Mined"
                />
                <Line
                  type="monotone"
                  dataKey="transactions"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={{ fill: '#4ade80' }}
                  name="Transactions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {miningData && miningData.topMiners.length > 0 && (
        <div className="top-miners-section">
          <h3>Top Miners (Last 7 Days)</h3>
          <div className="top-miners-list">
            {miningData.topMiners.slice(0, 5).map((miner, idx) => (
              <div key={miner.userId} className="top-miner-item">
                <span className="rank">#{idx + 1}</span>
                <span className="username">{miner.username}</span>
                <span className="coins">{miner.totalCoins.toFixed(2)} EXC</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatLargeNumber(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default Dashboard;
