import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getRecentAlerts,
  confirmHazardAlert,
  dismissHazardAlert,
  seedSampleAlerts
} from '../../actions/hazard';
import HazardReport from './HazardReport';
import { calculateDistanceKm, formatDistance } from '../../utils/avatarPresets';
import { createWatermarkFreeTileLayer } from '../../utils/osmNavigationService';

export const HAZARD_META = {
  police: { icon: '👮', label: 'Police Radar', color: '#3b82f6', category: 'enforcement' },
  speed_camera_instant: { icon: '📸', label: 'Speed Camera', color: '#f97316', category: 'enforcement' },
  instant_camera: { icon: '📸', label: 'Speed Camera', color: '#f97316', category: 'enforcement' },
  speed_camera_average: { icon: '⏱️', label: 'Avg Speed Zone', color: '#eab308', category: 'enforcement' },
  average_camera: { icon: '⏱️', label: 'Avg Speed Zone', color: '#eab308', category: 'enforcement' },
  traffic_light: { icon: '🚦', label: 'Red Light Cam', color: '#ef4444', category: 'enforcement' },
  traffic_lights: { icon: '🚦', label: 'Red Light Cam', color: '#ef4444', category: 'enforcement' },
  accident: { icon: '💥', label: 'Accident / Crash', color: '#dc2626', category: 'incident' },
  traffic_density: { icon: '🚗', label: 'Traffic Jam', color: '#a855f7', category: 'traffic' },
  traffic_jam: { icon: '🚗', label: 'Traffic Jam', color: '#a855f7', category: 'traffic' },
  obstruction: { icon: '🚧', label: 'Road Hazard', color: '#f59e0b', category: 'hazard' },
  hazard_on_road: { icon: '🚧', label: 'Road Hazard', color: '#f59e0b', category: 'hazard' },
  pothole: { icon: '🕳️', label: 'Severe Pothole', color: '#d97706', category: 'hazard' },
  stopped_vehicle: { icon: '🚙', label: 'Vehicle on Shoulder', color: '#06b6d4', category: 'hazard' },
  construction: { icon: '🚧', label: 'Roadworks', color: '#eab308', category: 'traffic' },
  roadworks: { icon: '🚧', label: 'Roadworks', color: '#eab308', category: 'traffic' },
  road_closure: { icon: '⛔', label: 'Road Closed', color: '#b91c1c', category: 'traffic' },
  lane_closure: { icon: '⚠️', label: 'Lane Closed', color: '#f97316', category: 'traffic' },
  bad_weather: { icon: '🌊', label: 'Flooding / Weather', color: '#0ea5e9', category: 'hazard' }
};

const AlertsFeed = () => {
  const dispatch = useDispatch();
  const hazard = useSelector((state) => state.hazard);
  const { alerts, loading } = hazard;

  const [showReportModal, setShowReportModal] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: 51.5074, lng: -0.1278 });
  const [gpsLocked, setGpsLocked] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'time'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'map' | 'list'
  const [activeAlertId, setActiveAlertId] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const alertMarkersRef = useRef({});
  const watchIdRef = useRef(null);

  const getLeaflet = useCallback(() => window.L, []);

  // Set up global hook for popup button clicks
  useEffect(() => {
    window.__cardemConfirmAlert = (id) => {
      dispatch(confirmHazardAlert(id));
    };
    window.__cardemDismissAlert = (id) => {
      dispatch(dismissHazardAlert(id));
    };
    return () => {
      delete window.__cardemConfirmAlert;
      delete window.__cardemDismissAlert;
    };
  }, [dispatch]);

  // Acquire user GPS location
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onSuccess = (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserCoords({ lat, lng });
      setGpsLocked(true);

      if (mapInstanceRef.current && userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      }
    };

    const onError = (err) => {
      console.warn('Alerts GPS acquisition warning:', err.message);
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 10000
    });

    watchIdRef.current = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      maximumAge: 5000
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Fetch alerts
  useEffect(() => {
    dispatch(getRecentAlerts(userCoords));
    const interval = setInterval(() => {
      dispatch(getRecentAlerts(userCoords));
    }, 15000);
    return () => clearInterval(interval);
  }, [dispatch, userCoords]);

  // Initialize Map
  useEffect(() => {
    const L = getLeaflet();
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    createWatermarkFreeTileLayer(L).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // User position marker
    const userIcon = L.divIcon({
      className: 'user-map-marker-container',
      html: `
        <div class="user-pulse-marker">
          <div class="marker-core">🏎️</div>
          <div class="marker-pulse"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const userMarker = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`
      <div style="font-family: 'Outfit', sans-serif; color: #111; padding: 4px;">
        <strong style="font-size: 14px;">📍 Your Vehicle Location</strong><br/>
        <span style="font-size: 11px; color: #555;">GPS Active Telemetry</span>
      </div>
    `);
    userMarkerRef.current = userMarker;
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getLeaflet]);

  // Re-center map when GPS locks
  useEffect(() => {
    if (gpsLocked && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 13, { animate: true });
    }
  }, [gpsLocked, userCoords.lat, userCoords.lng]);

  // Compute distance for all alerts
  const processedAlerts = alerts.map((alert) => {
    const coords = alert.location?.coordinates; // [lng, lat]
    let alertLat = null;
    let alertLng = null;
    if (coords && coords.length === 2) {
      alertLng = coords[0];
      alertLat = coords[1];
    }
    const distanceKm =
      alertLat !== null && alertLng !== null
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, alertLat, alertLng)
        : null;

    const meta = HAZARD_META[alert.alert_type] || {
      icon: '⚠️',
      label: alert.alert_type.replace(/_/g, ' '),
      color: '#f59e0b',
      category: 'hazard'
    };

    return {
      ...alert,
      alertLat,
      alertLng,
      distanceKm,
      distanceFormatted: formatDistance(distanceKm),
      meta
    };
  });

  // Filter alerts
  const filteredAlerts = processedAlerts.filter((alert) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'enforcement') {
      return ['police', 'speed_camera_instant', 'speed_camera_average', 'traffic_light', 'instant_camera', 'average_camera'].includes(alert.alert_type);
    }
    if (selectedCategory === 'incident') {
      return ['accident'].includes(alert.alert_type);
    }
    if (selectedCategory === 'traffic') {
      return ['traffic_density', 'traffic_jam', 'construction', 'roadworks', 'road_closure', 'lane_closure'].includes(alert.alert_type);
    }
    if (selectedCategory === 'hazard') {
      return ['obstruction', 'hazard_on_road', 'pothole', 'stopped_vehicle', 'bad_weather'].includes(alert.alert_type);
    }
    return true;
  });

  // Sort alerts
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (sortBy === 'distance') {
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    }
    // Sort by created_at newest first
    return new Date(b.created_at) - new Date(a.created_at);
  });

  // Update Mini Logo Markers on Map
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear stale markers
    Object.keys(alertMarkersRef.current).forEach((id) => {
      if (!processedAlerts.some((a) => a._id === id)) {
        map.removeLayer(alertMarkersRef.current[id]);
        delete alertMarkersRef.current[id];
      }
    });

    // Render alert mini logos
    processedAlerts.forEach((alert) => {
      if (alert.alertLat === null || alert.alertLng === null) return;

      const meta = alert.meta;
      const timeAgo = Math.max(0, Math.round((Date.now() - new Date(alert.created_at).getTime()) / 60000));
      const timeText = timeAgo === 0 ? 'Just now' : `${timeAgo}m ago`;

      // Interactive mini logo HTML with pulsing halo
      const miniLogoHtml = `
        <div class="alert-mini-logo-wrapper" style="--accent-color: ${meta.color};">
          <div class="alert-mini-logo-badge">
            <span class="mini-logo-emoji">${meta.icon}</span>
          </div>
          <div class="alert-mini-logo-pulse"></div>
        </div>
      `;

      const miniIcon = L.divIcon({
        className: 'alert-leaflet-icon-container',
        html: miniLogoHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const popupHtml = `
        <div class="hud-leaflet-alert-popup">
          <div class="popup-header">
            <span class="popup-icon" style="background: ${meta.color}25; color: ${meta.color};">${meta.icon}</span>
            <div class="popup-header-info">
              <span class="popup-category" style="color: ${meta.color};">${meta.label.toUpperCase()}</span>
              <h4 class="popup-title">${alert.title || meta.label}</h4>
            </div>
          </div>

          <div class="popup-distance-pill">
            <span>📍 <strong>${alert.distanceFormatted}</strong></span>
            <span class="popup-time">${timeText}</span>
          </div>

          ${alert.road_name ? `<div class="popup-road"><i class="fa-solid fa-road"></i> ${alert.road_name}</div>` : ''}
          ${alert.description ? `<p class="popup-desc">${alert.description}</p>` : ''}

          <div class="popup-meta-chips">
            ${alert.speed_limit ? `<span class="speed-chip">${alert.speed_limit} MPH</span>` : ''}
            <span class="confirm-chip">👍 ${alert.confirmations?.length || 1} confirmed</span>
            ${alert.reported_by?.name ? `<span class="reporter-chip">By: ${alert.reported_by.name}</span>` : ''}
          </div>

          <div class="popup-actions-row">
            <button class="popup-btn popup-btn-confirm" onclick="window.__cardemConfirmAlert('${alert._id}')">
              👍 Still There
            </button>
            <button class="popup-btn popup-btn-dismiss" onclick="window.__cardemDismissAlert('${alert._id}')">
              ✕ Cleared
            </button>
          </div>
        </div>
      `;

      if (!alertMarkersRef.current[alert._id]) {
        const marker = L.marker([alert.alertLat, alert.alertLng], { icon: miniIcon }).addTo(map);
        marker.bindPopup(popupHtml, { className: 'cardem-custom-popup', maxWidth: 320 });
        marker.on('click', () => {
          setActiveAlertId(alert._id);
        });
        alertMarkersRef.current[alert._id] = marker;
      } else {
        alertMarkersRef.current[alert._id].setLatLng([alert.alertLat, alert.alertLng]);
        alertMarkersRef.current[alert._id].setPopupContent(popupHtml);
      }
    });
  }, [processedAlerts, getLeaflet]);

  // Center on alert and open popup
  const handleFocusAlertOnMap = (alert) => {
    setActiveAlertId(alert._id);
    if (mapInstanceRef.current && alert.alertLat && alert.alertLng) {
      mapInstanceRef.current.setView([alert.alertLat, alert.alertLng], 15, { animate: true });
      const marker = alertMarkersRef.current[alert._id];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userCoords.lat, userCoords.lng], 14, { animate: true });
    }
  };

  const handleSeedAlerts = () => {
    dispatch(seedSampleAlerts(userCoords));
  };

  return (
    <div className="alerts-feed-container animate-fade-in">
      {/* Top Cockpit Header */}
      <div className="alerts-header">
        <div className="header-left">
          <h1 className="page-title">
            <span className="text-gradient">Driver Hazard & Road Network</span> ⚠️
          </h1>
          <p className="subtitle">
            Waze & Google Maps-grade crowdsourced alerts with real-time distance sorting and map telemetry.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-outline btn-sm"
            onClick={handleSeedAlerts}
            title="Seed Sample Waze Alerts"
          >
            <i className="fa-solid fa-satellite"></i> Seed Alerts
          </button>
          <button
            className="btn btn-danger btn-glow"
            onClick={() => setShowReportModal(true)}
          >
            🚨 Report Alert
          </button>
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="alerts-controls-bar hud-card">
        {/* Category Pills */}
        <div className="category-filter-scroll">
          <button
            className={`filter-pill ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            🌐 All ({processedAlerts.length})
          </button>
          <button
            className={`filter-pill ${selectedCategory === 'enforcement' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('enforcement')}
          >
            👮 Police & Cameras
          </button>
          <button
            className={`filter-pill ${selectedCategory === 'incident' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('incident')}
          >
            💥 Accidents
          </button>
          <button
            className={`filter-pill ${selectedCategory === 'traffic' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('traffic')}
          >
            🚗 Traffic & Closures
          </button>
          <button
            className={`filter-pill ${selectedCategory === 'hazard' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('hazard')}
          >
            ⚠️ Hazards & Potholes
          </button>
        </div>

        {/* Sort and View Mode Selectors */}
        <div className="sort-view-controls">
          <div className="sort-selector-group">
            <span className="control-label">Sort:</span>
            <button
              className={`btn-sort-toggle ${sortBy === 'distance' ? 'active' : ''}`}
              onClick={() => setSortBy('distance')}
              title="Sort by nearest distance from you"
            >
              <i className="fa-solid fa-location-crosshairs"></i> Nearest First
            </button>
            <button
              className={`btn-sort-toggle ${sortBy === 'time' ? 'active' : ''}`}
              onClick={() => setSortBy('time')}
              title="Sort by latest report time"
            >
              <i className="fa-solid fa-clock"></i> Newest
            </button>
          </div>

          <div className="view-mode-toggle">
            <button
              className={`btn-view-mode ${viewMode === 'split' ? 'active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Split Map & Cards"
            >
              <i className="fa-solid fa-table-columns"></i>
            </button>
            <button
              className={`btn-view-mode ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
              title="Map Only"
            >
              <i className="fa-solid fa-map"></i>
            </button>
            <button
              className={`btn-view-mode ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Cards Only"
            >
              <i className="fa-solid fa-list"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className={`alerts-layout-container view-${viewMode}`}>
        {/* Interactive Leaflet Map with Mini Logos */}
        {viewMode !== 'list' && (
          <div className="alerts-map-frame hud-card">
            <div ref={mapContainerRef} className="alerts-leaflet-map" />

            {/* Map Floating HUD Overlay */}
            <div className="map-hud-overlay">
              <div className="hud-badge-gps">
                <span className={`status-dot ${gpsLocked ? 'live' : 'searching'}`}></span>
                <span>{gpsLocked ? 'GPS Locked' : 'Locating...'}</span>
              </div>
              <button
                className="btn-recenter-map"
                onClick={handleRecenter}
                title="Center on My Vehicle"
              >
                <i className="fa-solid fa-crosshairs"></i>
              </button>
            </div>

            <div className="map-legend-banner">
              <span className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }}></span> Police</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }}></span> Cameras</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#dc2626' }}></span> Crash</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#a855f7' }}></span> Traffic</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: '#f59e0b' }}></span> Hazard</span>
              <span className="legend-hint">Tap any mini logo on map for details & verification</span>
            </div>
          </div>
        )}

        {/* Sorted Cards Feed */}
        {viewMode !== 'map' && (
          <div className="alerts-cards-column">
            {loading && processedAlerts.length === 0 ? (
              <div className="hud-card loading-card">
                <div className="loading-spinner"></div>
                <p>Scanning regional telemetry nodes & radars...</p>
              </div>
            ) : sortedAlerts.length === 0 ? (
              <div className="hud-card empty-state">
                <div className="empty-icon">🟢</div>
                <h3>Roads are Clear in this Category!</h3>
                <p>No active police traps, cameras, or closures reported recently matching your filter.</p>
                <button className="btn btn-secondary btn-sm mt-3" onClick={handleSeedAlerts}>
                  <i className="fa-solid fa-plus"></i> Populate Sample Waze Alerts
                </button>
              </div>
            ) : (
              <div className="alerts-list">
                {sortedAlerts.map((alert) => {
                  const meta = alert.meta;
                  const timeAgo = Math.max(0, Math.round((Date.now() - new Date(alert.created_at).getTime()) / 60000));
                  const isFocused = activeAlertId === alert._id;

                  return (
                    <div
                      key={alert._id}
                      className={`hud-card alert-card animate-fade-in ${isFocused ? 'is-focused' : ''}`}
                      style={{ '--card-accent': meta.color }}
                      onClick={() => handleFocusAlertOnMap(alert)}
                    >
                      <div className="alert-card-header">
                        <div className="alert-type-badge">
                          <span className="alert-icon" style={{ background: `${meta.color}22`, borderColor: meta.color }}>
                            {meta.icon}
                          </span>
                          <div>
                            <span className="alert-category" style={{ color: meta.color }}>
                              {meta.label.toUpperCase()}
                            </span>
                            <h3 className="alert-title">{alert.title || meta.label}</h3>
                          </div>
                        </div>

                        {/* Distance Badge */}
                        <div className="alert-distance-badge" title="Distance from current vehicle location">
                          <i className="fa-solid fa-location-arrow"></i>
                          <span>{alert.distanceFormatted}</span>
                        </div>
                      </div>

                      {alert.road_name && (
                        <div className="alert-road-name">
                          <i className="fa-solid fa-road"></i> {alert.road_name}
                        </div>
                      )}

                      {alert.description && (
                        <p className="alert-description">{alert.description}</p>
                      )}

                      <div className="alert-meta-row">
                        {alert.speed_limit && (
                          <span className="speed-limit-badge">
                            {alert.speed_limit} MPH
                          </span>
                        )}
                        <span className="confirmations-badge">
                          👍 {alert.confirmations?.length || 1} Confirmed
                        </span>
                        <span className="alert-time">
                          {timeAgo === 0 ? 'Just now' : `${timeAgo}m ago`}
                        </span>
                        {alert.reported_by?.name && (
                          <span className="reporter-badge">
                            By: {alert.reported_by.name}
                          </span>
                        )}
                      </div>

                      <div className="alert-actions-row" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => dispatch(confirmHazardAlert(alert._id))}
                          title="Verify that hazard is still active"
                        >
                          👍 Still There
                        </button>
                        <button
                          className="btn btn-secondary-ghost btn-sm"
                          onClick={() => dispatch(dismissHazardAlert(alert._id))}
                          title="Report as cleared / removed"
                        >
                          ✕ Cleared
                        </button>
                        <button
                          className="btn btn-hud-action btn-sm btn-pin-map"
                          onClick={() => handleFocusAlertOnMap(alert)}
                          title="Show on map"
                        >
                          <i className="fa-solid fa-map-pin text-cyan"></i> Pin
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <HazardReport
          currentCoords={userCoords}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default AlertsFeed;
