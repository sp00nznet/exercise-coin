import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import adminApi from '../services/api';

export default function TreasureMap() {
  const [mapData, setMapData] = useState(null);
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadMapData();
    loadDrops();
  }, [statusFilter]);

  const loadMapData = async () => {
    try {
      const response = await adminApi.getTreasureMapData();
      setMapData(response.data);
    } catch (error) {
      console.error('Failed to load map data:', error);
    }
  };

  const loadDrops = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getTreasureDrops({
        status: statusFilter || undefined,
        limit: 100
      });
      setDrops(response.data.drops || []);
    } catch (error) {
      console.error('Failed to load drops:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (drop) => {
    switch (drop.status) {
      case 'active': return '#4ade80';
      case 'collected': return '#888';
      case 'expired': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  // Default center (San Francisco)
  const defaultCenter = [37.7749, -122.4194];
  const center = drops.length > 0
    ? [drops[0].location.coordinates[1], drops[0].location.coordinates[0]]
    : defaultCenter;

  return (
    <div>
      <h1 className="page-title">Treasure Map</h1>

      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="card">
          <div className="card-title">Active Drops</div>
          <div className="card-value">{mapData?.activeDrops || 0}</div>
        </div>
        <div className="card">
          <div className="card-title">Total Collected</div>
          <div className="card-value">{mapData?.collectedDrops || 0}</div>
        </div>
        <div className="card">
          <div className="card-title">Coins in Circulation</div>
          <div className="card-value">{mapData?.totalCoinsInDrops?.toFixed(2) || '0.00'}</div>
        </div>
      </div>

      <div className="action-bar">
        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '10px', background: '#16213e', border: '1px solid #333', borderRadius: '8px', color: '#fff' }}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="collected">Collected</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="map-container">
        <MapContainer
          center={center}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {drops.map((drop) => (
            <CircleMarker
              key={drop._id}
              center={[drop.location.coordinates[1], drop.location.coordinates[0]]}
              radius={8}
              pathOptions={{
                color: getMarkerColor(drop),
                fillColor: getMarkerColor(drop),
                fillOpacity: 0.7
              }}
            >
              <Popup>
                <div style={{ color: '#333' }}>
                  <strong>{drop.amount.toFixed(4)} EXC</strong><br />
                  Status: {drop.status}<br />
                  Type: {drop.dropType}<br />
                  Created: {new Date(drop.createdAt).toLocaleDateString()}<br />
                  {drop.droppedBy && `By: ${drop.droppedBy.username}`}
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>Legend</h3>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
            <span>Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#888' }} />
            <span>Collected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <span>Expired</span>
          </div>
        </div>
      </div>
    </div>
  );
}
