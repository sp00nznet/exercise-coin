import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import './ExerciseMetrics.css';

const COLORS = ['#4ade80', '#ef4444', '#f59e0b', '#e94560'];

function ExerciseMetrics({ apiKey }) {
  const [period, setPeriod] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exercise/metrics?period=${period}`, {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch exercise metrics');

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading exercise metrics...</div>;
  }

  const pieData = data?.dailyStats?.length > 0
    ? [
        { name: 'Rewarded', value: data.dailyStats.reduce((sum, d) => sum + d.rewarded, 0) },
        { name: 'Invalid', value: data.dailyStats.reduce((sum, d) => sum + d.invalid, 0) }
      ]
    : [];

  return (
    <div className="exercise-metrics">
      <div className="metrics-header">
        <h2>Exercise Analytics</h2>
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
          title="Total Sessions"
          value={data?.summary?.totalSessions || 0}
          icon="🏃"
          color="accent"
        />
        <StatCard
          title="Total Steps"
          value={formatNumber(data?.summary?.totalSteps || 0)}
          icon="👟"
        />
        <StatCard
          title="Exercise Hours"
          value={data?.summary?.totalHours || 0}
          icon="⏱️"
        />
        <StatCard
          title="Success Rate"
          value={`${data?.summary?.successRate || 0}%`}
          icon="✅"
          color="success"
        />
      </div>

      <div className="charts-row">
        {data?.dailyStats?.length > 0 && (
          <div className="chart-section flex-2">
            <h3>Daily Sessions</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data.dailyStats}>
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
                  <Area
                    type="monotone"
                    dataKey="rewarded"
                    stackId="1"
                    stroke="#4ade80"
                    fill="#4ade80"
                    fillOpacity={0.5}
                    name="Rewarded"
                  />
                  <Area
                    type="monotone"
                    dataKey="invalid"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.5}
                    name="Invalid"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {pieData.length > 0 && (
          <div className="chart-section flex-1">
            <h3>Session Outcomes</h3>
            <div className="chart-container pie-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {data?.dailyStats?.length > 0 && (
        <div className="chart-section">
          <h3>Daily Steps</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                <XAxis
                  dataKey="_id"
                  stroke="#888"
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(val) => val.slice(5)}
                />
                <YAxis
                  stroke="#888"
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(val) => formatNumber(val)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #2a2a4a',
                    borderRadius: '8px'
                  }}
                  formatter={(val) => [formatNumber(val), 'Steps']}
                />
                <Bar dataKey="totalSteps" fill="#e94560" name="Steps" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {data?.invalidReasons?.length > 0 && (
        <div className="invalid-reasons-section">
          <h3>Invalid Session Reasons</h3>
          <div className="reasons-list">
            {data.invalidReasons.map((reason, idx) => (
              <div key={idx} className="reason-item">
                <span className="reason-text">{reason._id}</span>
                <span className="reason-count">{reason.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export default ExerciseMetrics;
