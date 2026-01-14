import React, { useState } from 'react';
import adminApi from '../services/api';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [downloading, setDownloading] = useState('');

  const downloadReport = async (type) => {
    setDownloading(type);

    try {
      let response;
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: 'csv'
      };

      switch (type) {
        case 'transactions':
          response = await adminApi.downloadTransactionReport(params);
          break;
        case 'transfers':
          response = await adminApi.downloadTransferReport(params);
          break;
        case 'treasure':
          response = await adminApi.downloadTreasureReport(params);
          break;
        default:
          return;
      }

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
      alert('Failed to download report');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div>
      <h1 className="page-title">Reports</h1>

      <div className="card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Date Range</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h3>Transaction Report</h3>
          <p>
            Export all transactions including mining rewards, transfers, and treasure activities
            within the selected date range.
          </p>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
            Includes: Date, User, Type, Amount, Status, Metadata
          </p>
          <button
            className="btn btn-primary"
            onClick={() => downloadReport('transactions')}
            disabled={downloading === 'transactions'}
          >
            {downloading === 'transactions' ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>

        <div className="report-card">
          <h3>Transfer Report</h3>
          <p>
            Export all user-to-user transfers including direct transfers and QR code transfers
            within the selected date range.
          </p>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
            Includes: Date, From User, To User, Amount, Type, Status
          </p>
          <button
            className="btn btn-primary"
            onClick={() => downloadReport('transfers')}
            disabled={downloading === 'transfers'}
          >
            {downloading === 'transfers' ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>

        <div className="report-card">
          <h3>Treasure Drop Report</h3>
          <p>
            Export all treasure drops including user drops and random drops within the
            selected date range.
          </p>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
            Includes: Date, Location, Amount, Type, Status, Collector
          </p>
          <button
            className="btn btn-primary"
            onClick={() => downloadReport('treasure')}
            disabled={downloading === 'treasure'}
          >
            {downloading === 'treasure' ? 'Downloading...' : 'Download CSV'}
          </button>
        </div>

        <div className="report-card">
          <h3>Friendly Transfer Report</h3>
          <p>
            Export all friendly transfers (trades between hiking users) and their bonus
            status within the selected date range.
          </p>
          <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
            Includes: Date, From User, To User, Amount, Bonus Awarded, Bonus Amount
          </p>
          <button
            className="btn btn-secondary"
            disabled
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
