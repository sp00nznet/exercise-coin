import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Miners from './pages/Miners';
import MiningMetrics from './pages/MiningMetrics';
import ExerciseMetrics from './pages/ExerciseMetrics';
import Sessions from './pages/Sessions';
import SystemHealth from './pages/SystemHealth';

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('adminApiKey') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (apiKey) {
      verifyApiKey();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyApiKey = async () => {
    try {
      const response = await fetch('/api/admin/health', {
        headers: { 'X-Admin-Key': apiKey }
      });
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('adminApiKey');
        setApiKey('');
      }
    } catch (error) {
      console.error('Failed to verify API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (key) => {
    localStorage.setItem('adminApiKey', key);
    setApiKey(key);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminApiKey');
    setApiKey('');
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#888'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Layout apiKey={apiKey} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard apiKey={apiKey} />} />
          <Route path="/users" element={<Users apiKey={apiKey} />} />
          <Route path="/users/:userId" element={<UserDetail apiKey={apiKey} />} />
          <Route path="/miners" element={<Miners apiKey={apiKey} />} />
          <Route path="/mining" element={<MiningMetrics apiKey={apiKey} />} />
          <Route path="/exercise" element={<ExerciseMetrics apiKey={apiKey} />} />
          <Route path="/sessions" element={<Sessions apiKey={apiKey} />} />
          <Route path="/system" element={<SystemHealth apiKey={apiKey} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
