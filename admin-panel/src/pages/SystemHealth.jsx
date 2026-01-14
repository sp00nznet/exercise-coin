import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import './SystemHealth.css';

function SystemHealth({ apiKey }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/admin/health', {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch health');

      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return <div className="loading">Loading system health...</div>;
  }

  return (
    <div className="system-health">
      <div className="health-header">
        <h2>System Health</h2>
        <div className={`status-indicator ${health?.status === 'healthy' ? 'healthy' : 'unhealthy'}`}>
          <span className="dot"></span>
          <span>{health?.status || 'unknown'}</span>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Uptime"
          value={formatUptime(health?.uptime || 0)}
          icon="⏱️"
          color="success"
        />
        <StatCard
          title="Active Daemons"
          value={health?.activeDaemons || 0}
          icon="⛏️"
        />
        <StatCard
          title="Heap Used"
          value={health?.memory?.heapUsed || '0 MB'}
          icon="📊"
        />
        <StatCard
          title="RSS Memory"
          value={health?.memory?.rss || '0 MB'}
          icon="💾"
        />
      </div>

      <div className="services-section">
        <h3>Service Status</h3>
        <div className="services-grid">
          <div className={`service-card ${health?.services?.database === 'connected' ? 'ok' : 'error'}`}>
            <span className="service-icon">🗄️</span>
            <span className="service-name">MongoDB</span>
            <span className={`service-status ${health?.services?.database}`}>
              {health?.services?.database || 'unknown'}
            </span>
          </div>
          <div className={`service-card ${health?.services?.daemonService === 'running' ? 'ok' : 'error'}`}>
            <span className="service-icon">⚙️</span>
            <span className="service-name">Daemon Service</span>
            <span className={`service-status ${health?.services?.daemonService}`}>
              {health?.services?.daemonService || 'unknown'}
            </span>
          </div>
        </div>
      </div>

      <div className="memory-section">
        <h3>Memory Usage</h3>
        <div className="memory-details">
          <div className="memory-item">
            <span className="label">Heap Total</span>
            <span className="value">{health?.memory?.heapTotal || '0 MB'}</span>
          </div>
          <div className="memory-item">
            <span className="label">Heap Used</span>
            <span className="value">{health?.memory?.heapUsed || '0 MB'}</span>
          </div>
          <div className="memory-item">
            <span className="label">RSS (Resident Set Size)</span>
            <span className="value">{health?.memory?.rss || '0 MB'}</span>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>Server Info</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Last Check</span>
            <span className="value">
              {health?.timestamp ? new Date(health.timestamp).toLocaleString() : '-'}
            </span>
          </div>
          <div className="info-item">
            <span className="label">Auto Refresh</span>
            <span className="value">Every 15 seconds</span>
          </div>
        </div>
      </div>

      <div className="logs-info">
        <h3>Logs Access</h3>
        <p>Full application logs can be accessed via:</p>
        <div className="code-block">
          <code>docker-compose logs -f server</code>
        </div>
        <p className="note">
          Or via PM2 if running manually: <code>pm2 logs exercise-coin-server</code>
        </p>
      </div>
    </div>
  );
}

export default SystemHealth;
