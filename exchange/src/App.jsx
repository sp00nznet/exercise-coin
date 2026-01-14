import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Trade from './pages/Trade';
import Orders from './pages/Orders';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminWallets from './pages/AdminWallets';
import AdminOrders from './pages/AdminOrders';

function Header() {
  const { admin, user, logoutAdmin, logoutUser } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  if (isAdminRoute && !admin) return null;

  return (
    <header className="header">
      <div className="logo">
        <span>💱</span>
        Exercise Coin Exchange
      </div>

      {isAdminRoute ? (
        <>
          <nav className="nav-links">
            <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
              Dashboard
            </Link>
            <Link to="/admin/wallets" className={location.pathname === '/admin/wallets' ? 'active' : ''}>
              Wallets
            </Link>
            <Link to="/admin/orders" className={location.pathname === '/admin/orders' ? 'active' : ''}>
              Orders
            </Link>
          </nav>
          <div className="user-info">
            <span>Admin: {admin?.name}</span>
            <button className="btn btn-outline" onClick={logoutAdmin}>Logout</button>
          </div>
        </>
      ) : (
        <>
          <nav className="nav-links">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Markets
            </Link>
            <Link to="/trade" className={location.pathname === '/trade' ? 'active' : ''}>
              Trade
            </Link>
            <Link to="/orders" className={location.pathname === '/orders' ? 'active' : ''}>
              Orders
            </Link>
            <Link to="/admin" className="admin-link">
              Admin Portal
            </Link>
          </nav>
          {user && (
            <div className="user-info">
              <span className="balance-badge">{user.balance?.toFixed(2) || '0.00'} EXC</span>
              <button className="btn btn-outline" onClick={logoutUser}>Logout</button>
            </div>
          )}
        </>
      )}
    </header>
  );
}

function AdminProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Header />
          <Routes>
            {/* Public/User Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/trade" element={<Trade />} />
            <Route path="/trade/:currency" element={<Trade />} />
            <Route path="/orders" element={<Orders />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/wallets" element={
              <AdminProtectedRoute>
                <AdminWallets />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/orders" element={
              <AdminProtectedRoute>
                <AdminOrders />
              </AdminProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
