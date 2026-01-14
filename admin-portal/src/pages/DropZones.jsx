import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polygon, Circle, useMapEvents } from 'react-leaflet';
import adminApi from '../services/api';

function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    }
  });
  return null;
}

export default function DropZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [zoneType, setZoneType] = useState('zipcode');
  const [formData, setFormData] = useState({
    name: '',
    zipcode: '',
    latitude: '',
    longitude: '',
    radius: 5000,
    priority: 5,
    minDropAmount: 0.1,
    maxDropAmount: 2
  });
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [editingZone, setEditingZone] = useState(null);

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getDropZones();
      setZones(response.data.zones || []);
    } catch (error) {
      console.error('Failed to load drop zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = {
        name: formData.name,
        zoneType,
        priority: parseInt(formData.priority),
        minDropAmount: parseFloat(formData.minDropAmount),
        maxDropAmount: parseFloat(formData.maxDropAmount)
      };

      if (zoneType === 'zipcode') {
        data.zipcode = formData.zipcode;
      } else if (zoneType === 'point') {
        data.center = {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        };
        data.radius = parseInt(formData.radius);
      } else if (zoneType === 'area') {
        data.polygon = polygonPoints.map(p => [p.lng, p.lat]);
      }

      if (editingZone) {
        await adminApi.updateDropZone(editingZone._id, data);
      } else {
        await adminApi.createDropZone(data);
      }

      setShowForm(false);
      setEditingZone(null);
      resetForm();
      loadZones();
    } catch (error) {
      console.error('Failed to save drop zone:', error);
      alert(error.response?.data?.error || 'Failed to save drop zone');
    }
  };

  const handleDelete = async (zoneId) => {
    if (!confirm('Are you sure you want to delete this drop zone?')) return;

    try {
      await adminApi.deleteDropZone(zoneId);
      loadZones();
    } catch (error) {
      console.error('Failed to delete drop zone:', error);
    }
  };

  const handleEdit = (zone) => {
    setEditingZone(zone);
    setZoneType(zone.zoneType);
    setFormData({
      name: zone.name,
      zipcode: zone.zipcode || '',
      latitude: zone.center?.latitude || '',
      longitude: zone.center?.longitude || '',
      radius: zone.radius || 5000,
      priority: zone.priority,
      minDropAmount: zone.minDropAmount,
      maxDropAmount: zone.maxDropAmount
    });
    if (zone.polygon && zone.polygon.length > 0) {
      setPolygonPoints(zone.polygon.map(p => ({ lng: p[0], lat: p[1] })));
    }
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      zipcode: '',
      latitude: '',
      longitude: '',
      radius: 5000,
      priority: 5,
      minDropAmount: 0.1,
      maxDropAmount: 2
    });
    setPolygonPoints([]);
    setZoneType('zipcode');
  };

  const handleLocationSelect = (latlng) => {
    if (zoneType === 'point') {
      setFormData(prev => ({
        ...prev,
        latitude: latlng.lat.toFixed(6),
        longitude: latlng.lng.toFixed(6)
      }));
    } else if (zoneType === 'area') {
      setPolygonPoints(prev => [...prev, latlng]);
    }
  };

  const defaultCenter = [37.7749, -122.4194];

  return (
    <div>
      <h1 className="page-title">Drop Zones</h1>

      <div className="action-bar">
        <button
          className="btn btn-primary"
          onClick={() => { setShowForm(true); setEditingZone(null); resetForm(); }}
        >
          Create Drop Zone
        </button>
      </div>

      {showForm && (
        <div className="zone-form">
          <h3 style={{ marginBottom: '20px' }}>
            {editingZone ? 'Edit Drop Zone' : 'Create New Drop Zone'}
          </h3>

          <div className="zone-type-selector">
            <button
              className={`zone-type-btn ${zoneType === 'zipcode' ? 'active' : ''}`}
              onClick={() => setZoneType('zipcode')}
              type="button"
            >
              Zipcode
            </button>
            <button
              className={`zone-type-btn ${zoneType === 'point' ? 'active' : ''}`}
              onClick={() => setZoneType('point')}
              type="button"
            >
              Point + Radius
            </button>
            <button
              className={`zone-type-btn ${zoneType === 'area' ? 'active' : ''}`}
              onClick={() => setZoneType('area')}
              type="button"
            >
              Draw Area
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Zone Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            {zoneType === 'zipcode' && (
              <div className="form-group">
                <label>Zipcode</label>
                <input
                  type="text"
                  value={formData.zipcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, zipcode: e.target.value }))}
                  placeholder="e.g., 94102"
                  required
                />
              </div>
            )}

            {zoneType === 'point' && (
              <>
                <p style={{ color: '#888', marginBottom: '12px' }}>
                  Click on the map to select a center point, or enter coordinates manually:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Radius (meters)</label>
                  <input
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, radius: e.target.value }))}
                    min="100"
                    max="50000"
                  />
                </div>
              </>
            )}

            {zoneType === 'area' && (
              <>
                <p style={{ color: '#888', marginBottom: '12px' }}>
                  Click on the map to draw polygon vertices ({polygonPoints.length} points selected)
                </p>
                {polygonPoints.length > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setPolygonPoints([])}
                    style={{ marginBottom: '12px' }}
                  >
                    Clear Points
                  </button>
                )}
              </>
            )}

            {(zoneType === 'point' || zoneType === 'area') && (
              <div className="map-container" style={{ height: '300px', marginBottom: '20px' }}>
                <MapContainer
                  center={formData.latitude && formData.longitude
                    ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
                    : defaultCenter}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker onLocationSelect={handleLocationSelect} />

                  {zoneType === 'point' && formData.latitude && formData.longitude && (
                    <Circle
                      center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]}
                      radius={parseInt(formData.radius)}
                      pathOptions={{ color: '#e94560', fillColor: '#e94560', fillOpacity: 0.2 }}
                    />
                  )}

                  {zoneType === 'area' && polygonPoints.length >= 3 && (
                    <Polygon
                      positions={polygonPoints.map(p => [p.lat, p.lng])}
                      pathOptions={{ color: '#e94560', fillColor: '#e94560', fillOpacity: 0.2 }}
                    />
                  )}
                </MapContainer>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Priority (1-10)</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  min="1"
                  max="10"
                />
              </div>
              <div className="form-group">
                <label>Min Drop Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minDropAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minDropAmount: e.target.value }))}
                  min="0.01"
                />
              </div>
              <div className="form-group">
                <label>Max Drop Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxDropAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxDropAmount: e.target.value }))}
                  min="0.01"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">
                {editingZone ? 'Update Zone' : 'Create Zone'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowForm(false); setEditingZone(null); resetForm(); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Priority</th>
              <th>Drops / Coins</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : zones.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No drop zones configured</td></tr>
            ) : (
              zones.map((zone) => (
                <tr key={zone._id}>
                  <td>{zone.name}</td>
                  <td>{zone.zoneType}</td>
                  <td style={{ fontSize: '12px', color: '#888' }}>
                    {zone.zoneType === 'zipcode' && zone.zipcode}
                    {zone.zoneType === 'point' && `${zone.center?.latitude?.toFixed(4)}, ${zone.center?.longitude?.toFixed(4)}`}
                    {zone.zoneType === 'area' && `${zone.polygon?.length || 0} vertices`}
                  </td>
                  <td>{zone.priority}</td>
                  <td>
                    {zone.totalDropsCreated} / {zone.totalCoinsDropped?.toFixed(2)} EXC
                  </td>
                  <td>
                    <span className={`badge badge-${zone.isActive ? 'success' : 'error'}`}>
                      {zone.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ marginRight: '8px', padding: '6px 12px' }}
                      onClick={() => handleEdit(zone)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn"
                      style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff' }}
                      onClick={() => handleDelete(zone._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
