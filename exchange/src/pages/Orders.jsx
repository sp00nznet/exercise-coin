import React, { useState, useEffect } from 'react';
import { exchangeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user, filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;

      const response = await exchangeApi.getOrders(params);
      setOrders(response.data.orders || []);
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
      await exchangeApi.cancelOrder(orderId);
      loadOrders();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel order');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (!user) {
    return (
      <div className="card">
        <div className="empty-state">
          <span>🔐</span>
          <h3>Login Required</h3>
          <p>Please log in to the main app to view your orders</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>📋</span> Your Orders
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
            <h3>No orders yet</h3>
            <p>Start trading to see your orders here</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Currency</th>
                  <th>EXC Amount</th>
                  <th>Currency Amount</th>
                  <th>Rate</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span style={{
                        color: order.type === 'buy' ? '#10b981' : '#ef4444',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}>
                        {order.type}
                      </span>
                    </td>
                    <td>{order.currency}</td>
                    <td>{order.excAmount.toFixed(2)} EXC</td>
                    <td>{order.currencyAmount.toFixed(8)} {order.currency}</td>
                    <td>{order.exchangeRate}</td>
                    <td>{order.fee.toFixed(2)} EXC</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      {order.status === 'pending' && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          onClick={() => handleCancel(order.id)}
                        >
                          Cancel
                        </button>
                      )}
                      {order.status === 'completed' && order.completedAt && (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                          {formatDate(order.completedAt)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;
