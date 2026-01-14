import React, { useState, useEffect } from 'react';
import adminApi from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({
        page,
        limit: 20,
        search: searchQuery || undefined
      });
      setUsers(response.data.users || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await adminApi.getUserDetails(userId);
      setUserDetails(response.data);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Failed to load user details:', error);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  return (
    <div>
      <h1 className="page-title">Users</h1>

      <div className="action-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              background: '#16213e',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              width: '300px'
            }}
          />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Total Coins</th>
              <th>Sessions</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td style={{ color: '#888' }}>{user.email}</td>
                  <td style={{ color: '#e94560' }}>{user.totalCoinsEarned?.toFixed(4)} EXC</td>
                  <td>{user.totalExerciseSessions || 0}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px' }}
                      onClick={() => viewUserDetails(user._id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span style={{ padding: '8px 16px', color: '#888' }}>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          Next
        </button>
      </div>

      {selectedUser && userDetails && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>User Details</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ color: '#888', marginBottom: '4px' }}>Username</p>
                <p style={{ fontSize: '18px' }}>{userDetails.user.username}</p>
              </div>
              <div>
                <p style={{ color: '#888', marginBottom: '4px' }}>Email</p>
                <p style={{ fontSize: '18px' }}>{userDetails.user.email}</p>
              </div>
              <div>
                <p style={{ color: '#888', marginBottom: '4px' }}>Total Coins</p>
                <p style={{ fontSize: '18px', color: '#e94560' }}>
                  {userDetails.user.totalCoinsEarned?.toFixed(4)} EXC
                </p>
              </div>
              <div>
                <p style={{ color: '#888', marginBottom: '4px' }}>Wallet Address</p>
                <p style={{ fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {userDetails.user.walletAddress || 'Not generated'}
                </p>
              </div>
            </div>

            <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>Statistics</h3>
            <div className="stats-grid">
              <div className="card">
                <div className="card-title">Exercise Sessions</div>
                <div className="card-value">{userDetails.stats.totalSessions}</div>
              </div>
              <div className="card">
                <div className="card-title">Mining Time</div>
                <div className="card-value">
                  {Math.floor(userDetails.stats.totalMiningSeconds / 60)}m
                </div>
              </div>
              <div className="card">
                <div className="card-title">Transfers Sent</div>
                <div className="card-value">{userDetails.stats.transfersSent}</div>
              </div>
              <div className="card">
                <div className="card-title">Transfers Received</div>
                <div className="card-value">{userDetails.stats.transfersReceived}</div>
              </div>
            </div>

            <h3 style={{ marginTop: '30px', marginBottom: '16px' }}>Recent Transactions</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {userDetails.recentTransactions?.map((tx) => (
                    <tr key={tx._id}>
                      <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td>{tx.type}</td>
                      <td style={{ color: tx.amount >= 0 ? '#4ade80' : '#ef4444' }}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(4)} EXC
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
