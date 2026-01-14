import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Layout.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/miners', label: 'Active Miners', icon: '⛏️' },
  { path: '/mining', label: 'Mining Metrics', icon: '📈' },
  { path: '/exercise', label: 'Exercise Metrics', icon: '🏃' },
  { path: '/sessions', label: 'Sessions', icon: '📋' },
  { path: '/system', label: 'System Health', icon: '🖥️' },
];

function Layout({ children, onLogout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(item => item.path === location.pathname)?.label || 'Admin';

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">💪</span>
            {!sidebarCollapsed && <span className="logo-text">Exercise Coin</span>}
          </div>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>
            <span className="nav-icon">🚪</span>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1 className="page-title">{currentPage}</h1>
          <div className="top-bar-right">
            <span className="admin-badge">Admin Panel</span>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
