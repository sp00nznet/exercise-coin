import React, { useState, useEffect } from 'react';
import DataTable from '../components/DataTable';
import './Sessions.css';

function Sessions({ apiKey }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchSessions();
  }, [status, limit]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, limit });
      const res = await fetch(`/api/admin/exercise/sessions?${params}`, {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch sessions');

      const data = await res.json();
      setSessions(data.sessions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleString()
    },
    {
      header: 'User',
      render: (row) => row.userId?.username || row.userId?.email || 'Unknown'
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`status-badge ${row.status}`}>{row.status}</span>
      )
    },
    {
      header: 'Steps',
      render: (row) => (row.totalSteps || 0).toLocaleString()
    },
    {
      header: 'Duration',
      render: (row) => {
        const mins = Math.floor((row.durationSeconds || 0) / 60);
        const secs = (row.durationSeconds || 0) % 60;
        return `${mins}m ${secs}s`;
      }
    },
    {
      header: 'Valid Time',
      render: (row) => row.validExerciseSeconds
        ? `${row.validExerciseSeconds}s`
        : '-'
    },
    {
      header: 'Coins',
      render: (row) => row.coinsEarned
        ? <span className="coins">+{row.coinsEarned.toFixed(2)}</span>
        : '-'
    },
    {
      header: 'Reason',
      render: (row) => row.invalidReason
        ? <span className="invalid-reason" title={row.invalidReason}>
            {row.invalidReason.substring(0, 30)}...
          </span>
        : '-'
    }
  ];

  return (
    <div className="sessions-page">
      <div className="sessions-header">
        <div className="sessions-filters">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="filter-select"
          >
            <option value="">All Sessions</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="rewarded">Rewarded</option>
            <option value="invalid">Invalid</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="filter-select"
          >
            <option value="25">25 rows</option>
            <option value="50">50 rows</option>
            <option value="100">100 rows</option>
          </select>
        </div>
        <button className="refresh-btn" onClick={fetchSessions}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading sessions...</div>
      ) : (
        <DataTable
          columns={columns}
          data={sessions}
          emptyMessage="No sessions found"
        />
      )}

      <div className="sessions-legend">
        <div className="legend-item">
          <span className="status-badge rewarded">rewarded</span>
          <span>Valid exercise with mining reward</span>
        </div>
        <div className="legend-item">
          <span className="status-badge completed">completed</span>
          <span>Ended but no reward</span>
        </div>
        <div className="legend-item">
          <span className="status-badge invalid">invalid</span>
          <span>Failed validation</span>
        </div>
        <div className="legend-item">
          <span className="status-badge active">active</span>
          <span>Currently in progress</span>
        </div>
      </div>
    </div>
  );
}

export default Sessions;
