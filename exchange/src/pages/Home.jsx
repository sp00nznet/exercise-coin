import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../services/api';

// Currency icons mapping
const CURRENCY_ICONS = {
  BTC: '₿',
  ETH: 'Ξ',
  LTC: 'Ł',
  USD: '$',
  EUR: '€',
  USDT: '₮',
  DOGE: 'Ð'
};

function Home() {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const response = await publicApi.getCurrencies();
      setCurrencies(response.data.currencies || []);
    } catch (err) {
      setError('Failed to load currencies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">{error}</div>
    );
  }

  if (currencies.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <span>💱</span>
          <h3>No currencies available</h3>
          <p>Check back soon! The admin is setting up trading pairs.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>📊</span> Available Markets
          </h2>
          <button className="btn btn-outline" onClick={loadCurrencies}>
            Refresh
          </button>
        </div>

        <div className="currency-grid">
          {currencies.map((currency) => (
            <Link
              key={currency.currency}
              to={`/trade/${currency.currency}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="currency-card">
                <div className="currency-header">
                  <div className="currency-icon">
                    {currency.iconUrl ? (
                      <img src={currency.iconUrl} alt={currency.currency} style={{ width: 32, height: 32 }} />
                    ) : (
                      CURRENCY_ICONS[currency.currency] || currency.currency[0]
                    )}
                  </div>
                  <div>
                    <div className="currency-name">{currency.name}</div>
                    <div className="currency-code">
                      EXC/{currency.currency}
                      {currency.type === 'fiat' && ' (Fiat)'}
                    </div>
                  </div>
                </div>

                <div className="currency-rate">
                  <span className="rate-label">1 EXC =</span>
                  <span className="rate-value">
                    {currency.exchangeRate.toFixed(currency.decimals || 8)} {currency.currency}
                  </span>
                </div>

                <div className="currency-rate">
                  <span className="rate-label">Trade Range</span>
                  <span className="rate-value">
                    {currency.minTradeAmount} - {currency.maxTradeAmount} EXC
                  </span>
                </div>

                {currency.notes && (
                  <div style={{ marginTop: 10, fontSize: '0.85rem', color: '#94a3b8' }}>
                    {currency.notes}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 15 }}>How It Works</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div>
            <h4>🏃 Earn EXC</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Exercise with the app to earn Exercise Coins through mining
            </p>
          </div>
          <div>
            <h4>💱 Trade</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Exchange your EXC for cryptocurrencies or fiat
            </p>
          </div>
          <div>
            <h4>💰 Cash Out</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Withdraw to your personal wallet or bank account
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
