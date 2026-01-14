import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">EXC Admin</div>

        <nav className="sidebar-nav">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
          <NavLink to="/transfers">Transfers</NavLink>
          <NavLink to="/treasure">Treasure Map</NavLink>
          <NavLink to="/drop-zones">Drop Zones</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/users">Users</NavLink>
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '30px' }}>
          <p style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
            Logged in as
          </p>
          <p style={{ color: '#fff', marginBottom: '16px' }}>{admin?.name}</p>
          <button className="btn btn-secondary" onClick={handleLogout} style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
