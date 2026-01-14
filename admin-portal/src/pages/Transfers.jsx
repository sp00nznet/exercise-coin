import React, { useState, useEffect } from 'react';
import adminApi from '../services/api';

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [friendlyTransfers, setFriendlyTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (activeTab === 'all') {
      loadTransfers();
    } else {
      loadFriendlyTransfers();
    }
  }, [page, activeTab]);

  const loadTransfers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getTransfers({ page, limit: 20 });
      setTransfers(response.data.transfers || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFriendlyTransfers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getFriendlyTransfers({ page, limit: 20 });
      setFriendlyTransfers(response.data.transfers || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load friendly transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Transfers</h1>

      <div className="action-bar">
        <div className="filters">
          <button
            className={`btn ${activeTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('all'); setPage(1); }}
          >
            All Transfers
          </button>
          <button
            className={`btn ${activeTab === 'friendly' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('friendly'); setPage(1); }}
          >
            Friendly Transfers
          </button>
        </div>
      </div>

      {activeTab === 'all' ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : transfers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No transfers found</td></tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.fromUserId?.username || 'N/A'}</td>
                    <td>{t.toUserId?.username || 'Pending'}</td>
                    <td style={{ color: '#4ade80' }}>{t.amount.toFixed(4)} EXC</td>
                    <td>{t.transferType}</td>
                    <td>
                      <span className={`badge badge-${t.status === 'completed' ? 'success' : 'pending'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Bonus Awarded</th>
                <th>Bonus Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : friendlyTransfers.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No friendly transfers found</td></tr>
              ) : (
                friendlyTransfers.map((t) => (
                  <tr key={t._id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>{t.fromUserId?.username || 'N/A'}</td>
                    <td>{t.toUserId?.username || 'N/A'}</td>
                    <td style={{ color: '#4ade80' }}>{t.transferAmount.toFixed(4)} EXC</td>
                    <td>
                      <span className={`badge badge-${t.bonusAwarded ? 'success' : 'pending'}`}>
                        {t.bonusAwarded ? 'Yes' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ color: '#e94560' }}>
                      {t.bonusAwarded ? `${t.bonusAmount.toFixed(4)} EXC` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

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
