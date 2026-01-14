import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Transfers from './pages/Transfers';
import TreasureMap from './pages/TreasureMap';
import DropZones from './pages/DropZones';
import Reports from './pages/Reports';
import Users from './pages/Users';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return <div className="login-container">Loading...</div>;
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/transfers" element={<Transfers />} />
                    <Route path="/treasure" element={<TreasureMap />} />
                    <Route path="/drop-zones" element={<DropZones />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/users" element={<Users />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
