import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/health', {
        headers: { 'X-Admin-Key': apiKey }
      });

      if (response.ok) {
        onLogin(apiKey);
      } else {
        setError('Invalid API key');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">💪</span>
          <h1>Exercise Coin</h1>
          <p>Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="apiKey">Admin API Key</label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your admin API key"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Verifying...' : 'Access Admin Panel'}
          </button>
        </form>

        <div className="login-footer">
          <p>API key is set in server environment variables</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
