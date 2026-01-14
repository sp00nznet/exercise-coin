import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import './Users.css';

function Users({ apiKey }) {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, status]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        search,
        status
      });

      const res = await fetch(`/api/admin/users?${params}`, {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch users');

      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
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
      header: 'Coins Earned',
      key: 'totalCoinsEarned',
      render: (row) => (row.totalCoinsEarned || 0).toFixed(2)
    },
    {
      header: 'Total Steps',
      key: 'totalSteps',
      render: (row) => (row.totalSteps || 0).toLocaleString()
    },
    {
      header: 'Daemon',
      key: 'daemonStatus',
      render: (row) => (
        <span className={`status-badge ${row.daemonStatus || 'inactive'}`}>
          {row.daemonStatus || 'inactive'}
        </span>
      )
    },
    {
      header: 'Last Active',
      key: 'lastActiveAt',
      render: (row) => row.lastActiveAt
        ? new Date(row.lastActiveAt).toLocaleDateString()
        : 'Never'
    },
    {
      header: 'Joined',
      key: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    }
  ];

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="users-filters">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="search-input"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="filter-select"
          >
            <option value="">All Users</option>
            <option value="active">Active (24h)</option>
          </select>
        </div>
        <div className="users-count">
          {pagination.total} users total
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            onRowClick={(user) => navigate(`/users/${user._id}`)}
            emptyMessage="No users found"
          />

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page === 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Users;
