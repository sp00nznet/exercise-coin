import React, { useState, useEffect } from 'react';
import { exchangeAdminApi } from '../services/api';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [processingOrder, setProcessingOrder] = useState(null);
  const [processForm, setProcessForm] = useState({
    action: 'complete',
    txHash: '',
    adminNotes: ''
  });

  useEffect(() => {
    loadOrders();
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;

      const response = await exchangeAdminApi.getOrders(params);
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await exchangeAdminApi.processOrder(processingOrder._id, processForm);
      setProcessingOrder(null);
      setProcessForm({ action: 'complete', txHash: '', adminNotes: '' });
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process order');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>📋</span> Exchange Orders
          </h2>
          <div className="btn-group">
            <select
              className="form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
            <button className="btn btn-outline" onClick={loadOrders}>
              Refresh
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading"><div className="spinner"></div></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <span>📭</span>
            <h3>No orders found</h3>
            <p>No orders match the current filter</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>EXC</th>
                  <th>Currency</th>
                  <th>Amount</th>
                  <th>Rate</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div>{order.userId?.username || 'Unknown'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {order.userId?.email}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        color: order.orderType === 'buy' ? '#10b981' : '#ef4444',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {order.orderType}
                      </span>
                    </td>
                    <td>{order.excAmount.toFixed(2)}</td>
                    <td>{order.currency}</td>
                    <td>{order.currencyAmount.toFixed(8)}</td>
                    <td>{order.exchangeRate}</td>
                    <td>{order.fee.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <div>{formatDate(order.createdAt)}</div>
                      {order.processedAt && (
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          Processed: {formatDate(order.processedAt)}
                        </div>
                      )}
                    </td>
                    <td>
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => setProcessingOrder(order)}
                        >
                          Process
                        </button>
                      )}
                      {order.externalWalletAddress && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 5, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          To: {order.externalWalletAddress}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Order Modal */}
      {processingOrder && (
        <div className="modal-overlay" onClick={() => setProcessingOrder(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Process Order</h3>
              <button className="modal-close" onClick={() => setProcessingOrder(null)}>&times;</button>
            </div>

            <div style={{ marginBottom: 20, padding: 15, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>User</div>
                  <div>{processingOrder.userId?.username}</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Type</div>
                  <div style={{ color: processingOrder.orderType === 'buy' ? '#10b981' : '#ef4444', textTransform: 'uppercase' }}>
                    {processingOrder.orderType}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>EXC Amount</div>
                  <div>{processingOrder.excAmount} EXC</div>
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Currency Amount</div>
                  <div>{processingOrder.currencyAmount} {processingOrder.currency}</div>
                </div>
              </div>
              {processingOrder.externalWalletAddress && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Send To</div>
                  <div style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
                    {processingOrder.externalWalletAddress}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleProcess}>
              <div className="form-group">
                <label className="form-label">Action</label>
                <select
                  className="form-select"
                  value={processForm.action}
                  onChange={(e) => setProcessForm({ ...processForm, action: e.target.value })}
                >
                  <option value="process">Mark as Processing</option>
                  <option value="complete">Complete Order</option>
                  <option value="fail">Fail Order</option>
                </select>
              </div>

              {processForm.action === 'complete' && processingOrder.orderType === 'sell' && (
                <div className="form-group">
                  <label className="form-label">Transaction Hash (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={processForm.txHash}
                    onChange={(e) => setProcessForm({ ...processForm, txHash: e.target.value })}
                    placeholder="Blockchain transaction hash"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Admin Notes (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={processForm.adminNotes}
                  onChange={(e) => setProcessForm({ ...processForm, adminNotes: e.target.value })}
                  placeholder="Internal notes"
                />
              </div>

              {processForm.action === 'complete' && (
                <div className="alert alert-info">
                  {processingOrder.orderType === 'buy'
                    ? `This will credit ${processingOrder.excAmount - processingOrder.fee} EXC to the user's wallet.`
                    : `This will confirm the ${processingOrder.currencyAmount} ${processingOrder.currency} transfer to the user's external wallet.`
                  }
                </div>
              )}

              {processForm.action === 'fail' && processingOrder.orderType === 'sell' && (
                <div className="alert alert-error">
                  This will refund {processingOrder.excAmount} EXC to the user's wallet.
                </div>
              )}

              <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setProcessingOrder(null)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${processForm.action === 'fail' ? 'btn-danger' : 'btn-primary'}`}
                >
                  {processForm.action === 'process' ? 'Mark Processing' :
                   processForm.action === 'complete' ? 'Complete Order' : 'Fail Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
