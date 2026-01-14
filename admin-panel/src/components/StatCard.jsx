import React from 'react';
import './StatCard.css';

function StatCard({ title, value, subtitle, icon, trend, color = 'default' }) {
  const getTrendIcon = () => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '';
  };

  const getTrendClass = () => {
    if (trend > 0) return 'positive';
    if (trend < 0) return 'negative';
    return '';
  };

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <span className="stat-title">{title}</span>
      </div>
      <div className="stat-value">{value}</div>
      {(subtitle || trend !== undefined) && (
        <div className="stat-footer">
          {subtitle && <span className="stat-subtitle">{subtitle}</span>}
          {trend !== undefined && (
            <span className={`stat-trend ${getTrendClass()}`}>
              {getTrendIcon()} {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
