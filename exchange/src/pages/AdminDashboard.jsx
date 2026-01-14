import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { exchangeAdminApi } from '../services/api';

function AdminDashboard() {
  const [wallets, setWallets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCurrencies: 0,
    activeCurrencies: 0,
    pendingOrders: 0,
    totalOrders: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletsRes, ordersRes] = await Promise.all([
        exchangeAdminApi.getWallets(),
        exchangeAdminApi.getOrders({ limit: 10 })
      ]);

      const walletsData = walletsRes.data.wallets || [];
      const ordersData = ordersRes.data.orders || [];

      setWallets(walletsData);
      setOrders(ordersData);
      setStats({
        totalCurrencies: walletsData.length,
        activeCurrencies: walletsData.filter(w => w.isEnabled).length,
        pendingOrders: ordersData.filter(o => o.status === 'pending').length,
        totalOrders: ordersRes.data.total || ordersData.length
      });
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Exchange Admin Dashboard</h2>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 30 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {stats.activeCurrencies}
          </div>
          <div style={{ color: '#94a3b8' }}>Active Currencies</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {stats.pendingOrders}
          </div>
          <div style={{ color: '#94a3b8' }}>Pending Orders</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6366f1' }}>
            {stats.totalOrders}
          </div>
          <div style={{ color: '#94a3b8' }}>Total Orders</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="btn-group">
          <Link to="/admin/wallets" className="btn btn-primary">
            Manage Wallets
          </Link>
          <Link to="/admin/orders" className="btn btn-secondary">
            Process Orders
          </Link>
        </div>
      </div>

      {/* Active Currencies */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3 className="card-title">Active Currencies</h3>
          <Link to="/admin/wallets" className="btn btn-outline">View All</Link>
        </div>
        {wallets.filter(w => w.isEnabled).length === 0 ? (
          <div className="empty-state">
            <span>💱</span>
            <p>No active currencies. Add wallets to start trading.</p>
          </div>
        ) : (
          <div className="admin-grid">
            {wallets.filter(w => w.isEnabled).slice(0, 4).map((wallet) => (
              <div key={wallet.currency} className="wallet-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{wallet.currency}</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{wallet.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                      1 EXC = {wallet.exchangeRate}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                      {wallet.currencyType}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3 className="card-title">Recent Orders</h3>
          <Link to="/admin/orders" className="btn btn-outline">View All</Link>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <span>📋</span>
            <p>No orders yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order._id}>
                    <td>{order.userId?.username || 'Unknown'}</td>
                    <td style={{ color: order.orderType === 'buy' ? '#10b981' : '#ef4444' }}>
                      {order.orderType?.toUpperCase()}
                    </td>
                    <td>{order.excAmount} EXC</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
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

export default AdminDashboard;
