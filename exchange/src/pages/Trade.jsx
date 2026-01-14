import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicApi, exchangeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Trade() {
  const { currency: urlCurrency } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [tradeType, setTradeType] = useState('buy');
  const [excAmount, setExcAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadCurrencies();
  }, []);

  useEffect(() => {
    if (urlCurrency && currencies.length > 0) {
      const found = currencies.find(c => c.currency === urlCurrency.toUpperCase());
      if (found) setSelectedCurrency(found);
    }
  }, [urlCurrency, currencies]);

  const loadCurrencies = async () => {
    try {
      const response = await publicApi.getCurrencies();
      setCurrencies(response.data.currencies || []);
      if (response.data.currencies.length > 0 && !selectedCurrency) {
        setSelectedCurrency(response.data.currencies[0]);
      }
    } catch (err) {
      setError('Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  const calculateCurrencyAmount = () => {
    if (!selectedCurrency || !excAmount) return 0;
    const amount = parseFloat(excAmount);
    const fee = amount * 0.01; // 1% fee
    return ((amount - fee) * selectedCurrency.exchangeRate).toFixed(selectedCurrency.decimals || 8);
  };

  const calculateExcFromCurrency = () => {
    if (!selectedCurrency || !excAmount) return 0;
    const amount = parseFloat(excAmount);
    const fee = amount * 0.01;
    return (amount - fee).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!user) {
      setError('Please log in to the main app to trade');
      return;
    }

    if (!selectedCurrency) {
      setError('Please select a currency');
      return;
    }

    const amount = parseFloat(excAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount < selectedCurrency.minTradeAmount) {
      setError(`Minimum trade amount is ${selectedCurrency.minTradeAmount} EXC`);
      return;
    }

    if (amount > selectedCurrency.maxTradeAmount) {
      setError(`Maximum trade amount is ${selectedCurrency.maxTradeAmount} EXC`);
      return;
    }

    if (tradeType === 'sell' && !walletAddress.trim()) {
      setError('Please enter your wallet address to receive funds');
      return;
    }

    try {
      setSubmitting(true);

      if (tradeType === 'buy') {
        const response = await exchangeApi.createBuyOrder({
          currency: selectedCurrency.currency,
          excAmount: amount
        });
        setSuccess(response.data.order);
      } else {
        const response = await exchangeApi.createSellOrder({
          currency: selectedCurrency.currency,
          excAmount: amount,
          externalWalletAddress: walletAddress.trim()
        });
        setSuccess(response.data.order);
      }

      setExcAmount('');
      setWalletAddress('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>💱</span> Trade EXC
          </h2>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {success && (
          <div className="alert alert-success">
            <strong>Order Created!</strong><br />
            {success.message}
            {success.paymentAddress && (
              <div style={{ marginTop: 10, wordBreak: 'break-all' }}>
                <strong>Send to:</strong> {success.paymentAddress}<br />
                <strong>Amount:</strong> {success.paymentAmount} {success.currency}
              </div>
            )}
          </div>
        )}

        <div className="trade-panel">
          <div>
            <div className="form-group">
              <label className="form-label">Select Currency</label>
              <select
                className="form-select"
                value={selectedCurrency?.currency || ''}
                onChange={(e) => {
                  const found = currencies.find(c => c.currency === e.target.value);
                  setSelectedCurrency(found);
                  navigate(`/trade/${e.target.value}`);
                }}
              >
                {currencies.map((c) => (
                  <option key={c.currency} value={c.currency}>
                    {c.name} ({c.currency})
                  </option>
                ))}
              </select>
            </div>

            {selectedCurrency && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 8, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#94a3b8' }}>Exchange Rate</span>
                  <span>1 EXC = {selectedCurrency.exchangeRate} {selectedCurrency.currency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ color: '#94a3b8' }}>Trade Fee</span>
                  <span>1%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Limits</span>
                  <span>{selectedCurrency.minTradeAmount} - {selectedCurrency.maxTradeAmount} EXC</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <form onSubmit={handleSubmit}>
              <div className="trade-type-tabs">
                <button
                  type="button"
                  className={`trade-tab ${tradeType === 'buy' ? 'active' : ''}`}
                  onClick={() => setTradeType('buy')}
                >
                  Buy EXC
                </button>
                <button
                  type="button"
                  className={`trade-tab sell ${tradeType === 'sell' ? 'active' : ''}`}
                  onClick={() => setTradeType('sell')}
                >
                  Sell EXC
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {tradeType === 'buy' ? 'EXC to Buy' : 'EXC to Sell'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={excAmount}
                  onChange={(e) => setExcAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={selectedCurrency?.minTradeAmount || 1}
                  max={selectedCurrency?.maxTradeAmount || 10000}
                  step="0.01"
                />
              </div>

              {tradeType === 'sell' && (
                <div className="form-group">
                  <label className="form-label">
                    Your {selectedCurrency?.currency} Wallet Address
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="Enter your wallet address"
                  />
                </div>
              )}

              {excAmount && selectedCurrency && (
                <div className="conversion-preview">
                  <div style={{ color: '#94a3b8' }}>
                    {tradeType === 'buy' ? 'You Pay' : 'You Sell'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {tradeType === 'buy'
                      ? `${calculateCurrencyAmount()} ${selectedCurrency.currency}`
                      : `${excAmount} EXC`
                    }
                  </div>
                  <div className="conversion-arrow">↓</div>
                  <div style={{ color: '#94a3b8' }}>You Receive</div>
                  <div className="conversion-amount">
                    {tradeType === 'buy'
                      ? `${calculateExcFromCurrency()} EXC`
                      : `${calculateCurrencyAmount()} ${selectedCurrency.currency}`
                    }
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 5 }}>
                    (1% fee included)
                  </div>
                </div>
              )}

              <button
                type="submit"
                className={`btn ${tradeType === 'buy' ? 'btn-primary' : 'btn-danger'}`}
                disabled={submitting || !user}
                style={{ width: '100%' }}
              >
                {submitting ? 'Processing...' : (tradeType === 'buy' ? 'Place Buy Order' : 'Place Sell Order')}
              </button>

              {!user && (
                <div style={{ marginTop: 15, textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                  Please log in to the main app to trade
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade;
