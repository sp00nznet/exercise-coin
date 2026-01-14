import React, { useState, useEffect } from 'react';
import { exchangeAdminApi } from '../services/api';

const CURRENCY_TYPES = ['crypto', 'fiat'];

function AdminWallets() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    currency: '',
    name: '',
    address: '',
    currencyType: 'crypto',
    network: '',
    exchangeRate: 0,
    isEnabled: true,
    minTradeAmount: 1,
    maxTradeAmount: 10000,
    decimals: 8,
    notes: ''
  });

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      const response = await exchangeAdminApi.getWallets();
      setWallets(response.data.wallets || []);
    } catch (err) {
      setError('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      currency: wallet.currency,
      name: wallet.name,
      address: wallet.address,
      currencyType: wallet.currencyType,
      network: wallet.network || '',
      exchangeRate: wallet.exchangeRate,
      isEnabled: wallet.isEnabled,
      minTradeAmount: wallet.minTradeAmount,
      maxTradeAmount: wallet.maxTradeAmount,
      decimals: wallet.decimals,
      notes: wallet.notes || ''
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingWallet(null);
    setFormData({
      currency: '',
      name: '',
      address: '',
      currencyType: 'crypto',
      network: '',
      exchangeRate: 0,
      isEnabled: true,
      minTradeAmount: 1,
      maxTradeAmount: 10000,
      decimals: 8,
      notes: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await exchangeAdminApi.upsertWallet(formData);
      setShowModal(false);
      loadWallets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save wallet');
    }
  };

  const handleUpdateRate = async (currency, newRate) => {
    try {
      await exchangeAdminApi.updateRate(currency, parseFloat(newRate));
      loadWallets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update rate');
    }
  };

  const handleDelete = async (currency) => {
    if (!confirm(`Are you sure you want to delete ${currency}?`)) return;

    try {
      await exchangeAdminApi.deleteWallet(currency);
      loadWallets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete wallet');
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
            <span>👛</span> Exchange Wallets
          </h2>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Add Currency
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {wallets.length === 0 ? (
          <div className="empty-state">
            <span>👛</span>
            <h3>No wallets configured</h3>
            <p>Add your first wallet to enable trading</p>
          </div>
        ) : (
          <div className="admin-grid">
            {wallets.map((wallet) => (
              <div key={wallet.currency} className={`wallet-card ${!wallet.isEnabled ? 'disabled' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{wallet.currency}</div>
                    <div style={{ color: '#94a3b8' }}>{wallet.name}</div>
                    <span className={`status-badge ${wallet.isEnabled ? 'status-completed' : 'status-cancelled'}`}>
                      {wallet.isEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem' }}>
                    {wallet.currencyType}
                  </span>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 5 }}>Wallet Address</div>
                  <div style={{ fontSize: '0.9rem', wordBreak: 'break-all', background: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 4 }}>
                    {wallet.address}
                  </div>
                </div>

                <div style={{ marginBottom: 15 }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 5 }}>Exchange Rate (1 EXC =)</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      defaultValue={wallet.exchangeRate}
                      step="0.00000001"
                      style={{ flex: 1 }}
                      onBlur={(e) => {
                        if (e.target.value !== String(wallet.exchangeRate)) {
                          handleUpdateRate(wallet.currency, e.target.value);
                        }
                      }}
                    />
                    <span>{wallet.currency}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: 10 }}>
                  <span>Limits: {wallet.minTradeAmount} - {wallet.maxTradeAmount} EXC</span>
                  <span>{wallet.decimals} decimals</span>
                </div>

                {wallet.network && (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: 10 }}>
                    Network: {wallet.network}
                  </div>
                )}

                <div className="wallet-actions">
                  <button className="btn btn-outline" onClick={() => handleEdit(wallet)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(wallet.currency)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingWallet ? `Edit ${editingWallet.currency}` : 'Add New Currency'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Currency Code</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                    placeholder="BTC"
                    required
                    disabled={editingWallet}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Bitcoin"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Wallet Address</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Your wallet address"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Currency Type</label>
                  <select
                    className="form-select"
                    value={formData.currencyType}
                    onChange={(e) => setFormData({ ...formData, currencyType: e.target.value })}
                  >
                    {CURRENCY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Network (optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    placeholder="mainnet, ethereum, etc."
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Exchange Rate (1 EXC =)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) || 0 })}
                    step="0.00000001"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Decimals</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.decimals}
                    onChange={(e) => setFormData({ ...formData, decimals: parseInt(e.target.value) || 8 })}
                    min="0"
                    max="18"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                <div className="form-group">
                  <label className="form-label">Min Trade (EXC)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.minTradeAmount}
                    onChange={(e) => setFormData({ ...formData, minTradeAmount: parseFloat(e.target.value) || 1 })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Max Trade (EXC)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.maxTradeAmount}
                    onChange={(e) => setFormData({ ...formData, maxTradeAmount: parseFloat(e.target.value) || 10000 })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (shown to users)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any notes for users"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isEnabled}
                    onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                  />
                  <span>Trading Enabled</span>
                </label>
              </div>

              <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingWallet ? 'Save Changes' : 'Add Currency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWallets;
