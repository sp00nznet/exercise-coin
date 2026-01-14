import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import './MiningMetrics.css';

function MiningMetrics({ apiKey }) {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/mining/metrics?period=${period}`, {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch mining metrics');

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading mining metrics...</div>;
  }

  return (
    <div className="mining-metrics">
      <div className="metrics-header">
        <h2>Mining Performance</h2>
        <div className="period-selector">
          {['24h', '7d', '30d'].map(p => (
            <button
              key={p}
              className={period === p ? 'active' : ''}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Coins Mined"
          value={data?.summary?.totalCoins?.toFixed(2) || '0'}
          icon="💰"
          color="accent"
        />
        <StatCard
          title="Total Transactions"
          value={data?.summary?.totalTransactions || 0}
          icon="📊"
        />
        <StatCard
          title="Avg Coins/Day"
          value={data?.summary?.avgCoinsPerDay || '0'}
          icon="📈"
          color="success"
        />
      </div>

      {data?.dailyStats?.length > 0 && (
        <div className="chart-section">
          <h3>Daily Mining Output</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyStats}>
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
                <Bar dataKey="totalCoins" fill="#e94560" name="Coins Mined" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data?.dailyStats?.length > 0 && (
        <div className="chart-section">
          <h3>Mining Transactions</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.dailyStats}>
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
                  dataKey="transactions"
                  stroke="#4ade80"
                  strokeWidth={2}
                  name="Transactions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data?.topMiners?.length > 0 && (
        <div className="top-miners-section">
          <h3>Top Miners ({period})</h3>
          <div className="top-miners-table">
            <div className="table-header">
              <span>Rank</span>
              <span>User</span>
              <span>Transactions</span>
              <span>Coins Earned</span>
            </div>
            {data.topMiners.map((miner, idx) => (
              <div key={miner.userId} className="table-row">
                <span className="rank">#{idx + 1}</span>
                <span className="username">{miner.username}</span>
                <span className="transactions">{miner.transactions}</span>
                <span className="coins">{miner.totalCoins.toFixed(2)} EXC</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MiningMetrics;
