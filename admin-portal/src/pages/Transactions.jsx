import React, { useState, useEffect } from 'react';
import adminApi from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    loadTransactions();
  }, [page, typeFilter]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getTransactions({
        page,
        limit: 20,
        type: typeFilter || undefined
      });
      setTransactions(response.data.transactions || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Transactions</h1>

      <div className="action-bar">
        <div className="filters">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ padding: '10px', background: '#16213e', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
          >
            <option value="">All Types</option>
            <option value="mining_reward">Mining Reward</option>
            <option value="transfer_in">Transfer In</option>
            <option value="transfer_out">Transfer Out</option>
            <option value="treasure_drop">Treasure Drop</option>
            <option value="treasure_collect">Treasure Collect</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No transactions found</td></tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>{new Date(tx.createdAt).toLocaleString()}</td>
                  <td>{tx.userId?.username || 'N/A'}</td>
                  <td>{tx.type}</td>
                  <td style={{ color: tx.amount >= 0 ? '#4ade80' : '#ef4444' }}>
                    {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(4)} EXC
                  </td>
                  <td>
                    <span className={`badge badge-${tx.status === 'confirmed' ? 'success' : 'pending'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ color: '#888', fontSize: '12px' }}>
                    {tx.metadata?.type || '-'}
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
    </div>
  );
}
