import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getConvoy, updateTelemetry, receivePeerLocation } from '../../actions/convoy';
import { getNearbyAlerts, receiveIncomingHazard } from '../../actions/hazard';
import { submitDriveStats } from '../../actions/stats';
import socketService from '../../utils/socketService';
import WalkieTalkie from '../walkie/WalkieTalkie';
import HazardReport from '../alerts/HazardReport';

const HAZARD_MAP_COLORS = {
  police: '#ff3860',
  instant_camera: '#ff793f',
  average_camera: '#ffb142',
  obstruction: '#f7b731',
  road_closure: '#eb4d4b',
  lane_closure: '#f0932b',
  traffic_density: '#e056fd',
  traffic_lights: '#686de0'
};

const ConvoyMapHUD = ({
  getConvoy,
  updateTelemetry,
  receivePeerLocation,
  getNearbyAlerts,
  receiveIncomingHazard,
  submitDriveStats,
  convoy: { convoy, participantLocations, activeSpeaker },
  hazard: { alerts },
  auth: { user },
  profile: { profile }
}) => {
  const { id: convoyId } = useParams();
  const navigate = useNavigate();

  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [topSpeedDrive, setTopSpeedDrive] = useState(0);
  const [heading, setHeading] = useState(0);
  const [coords, setCoords] = useState({ lat: 51.5074, lng: -0.1278 });
  const [unitMph, setUnitMph] = useState(false);
  const [showHazardDrawer, setShowHazardDrawer] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [harshBrakingCount, setHarshBrakingCount] = useState(0);
  const [harshAccelCount, setHarshAccelCount] = useState(0);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const peerMarkersRef = useRef({});
  const hazardMarkersRef = useRef({});
  const watchIdRef = useRef(null);
  const prevSpeedRef = useRef(0);
  const prevTimeRef = useRef(Date.now());

  // Safe Leaflet loader
  const getLeaflet = useCallback(() => {
    return window.L;
  }, []);

  // Fetch convoy details and join sockets
  useEffect(() => {
    getConvoy(convoyId);

    const activeVehicle = profile?.garage?.find((v) => v.is_primary) || profile?.garage?.[0];

    socketService.joinConvoy(convoyId, {
      _id: user?._id,
      name: user?.name,
      avatar: user?.avatar,
      vehicle: activeVehicle
    });

    // Register real-time socket callbacks
    socketService.onParticipantLocation((data) => {
      receivePeerLocation(data);
    });

    socketService.onHazardBroadcast((data) => {
      receiveIncomingHazard(data);
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [convoyId, getConvoy, profile, receiveIncomingHazard, receivePeerLocation, user]);

  // Initialize Map
  useEffect(() => {
    const L = getLeaflet();
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Automotive high-contrast dark mode tiles (CartoDB Dark Matter)
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial User Marker
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

    const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`<b>You (${user?.name || 'Driver'})</b>`);
    userMarkerRef.current = userMarker;

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [getLeaflet]);

  // High Precision Geolocation Streamer
  useEffect(() => {
    if (!navigator.geolocation) return;

    const options = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    };

    const handleSuccess = (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const rawSpeed = position.coords.speed || 0; // m/s
      const speedKmh = Math.max(0, Math.round(rawSpeed * 3.6));
      const head = position.coords.heading || 0;

      const now = Date.now();
      const dt = (now - prevTimeRef.current) / 1000;
      if (dt > 0.5) {
        const dv = rawSpeed - prevSpeedRef.current;
        const accel = dv / dt; // m/s^2

        // Harsh acceleration > 3.8 m/s^2 (~0.4g)
        if (accel > 3.8) {
          setHarshAccelCount((prev) => prev + 1);
        }
        // Harsh braking < -4.5 m/s^2 (~0.46g)
        if (accel < -4.5) {
          setHarshBrakingCount((prev) => prev + 1);
        }

        prevSpeedRef.current = rawSpeed;
        prevTimeRef.current = now;
      }

      setCoords({ lat, lng });
      setCurrentSpeed(speedKmh);
      setHeading(Math.round(head));
      if (speedKmh > topSpeedDrive) {
        setTopSpeedDrive(speedKmh);
      }

      // Update Local Marker and follow driver
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([lat, lng], { animate: true });
      }

      // Dispatch Telemetry via Sockets & Redux
      const activeVehicle = profile?.garage?.find((v) => v.is_primary) || profile?.garage?.[0];
      updateTelemetry(convoyId, {
        lat,
        lng,
        speed: rawSpeed,
        heading: head,
        vehicle: activeVehicle
      });

      // Periodically query hazards near current position
      getNearbyAlerts(lat, lng, 15000);
    };

    const handleError = (err) => {
      console.warn('Geolocation telemetry warning:', err.message);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [convoyId, getNearbyAlerts, profile, topSpeedDrive, updateTelemetry]);

  // Update Peer Markers on the Map
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    Object.keys(participantLocations).forEach((peerId) => {
      if (peerId === user?._id) return; // skip own marker

      const pData = participantLocations[peerId];
      if (!pData || !pData.lat || !pData.lng) return;

      const peerSpeed = Math.round((pData.speed || 0) * 3.6);
      const vehicleEmoji = pData.vehicle?.type === 'motorcycle' ? '🏍️' : '🏎️';

      if (peerMarkersRef.current[peerId]) {
        peerMarkersRef.current[peerId].setLatLng([pData.lat, pData.lng]);
        peerMarkersRef.current[peerId].setPopupContent(`
          <div class="peer-popup">
            <b>${pData.name || 'Convoy Peer'}</b><br/>
            Ride: ${pData.vehicle?.make || 'Enthusiast'} ${pData.vehicle?.model || 'Ride'}<br/>
            Speed: ${peerSpeed} km/h
          </div>
        `);
      } else {
        const peerIcon = L.divIcon({
          className: 'peer-map-marker-container',
          html: `
            <div class="peer-pin">
              <span class="peer-emoji">${vehicleEmoji}</span>
              <span class="peer-label">${pData.name ? pData.name.split(' ')[0] : 'Driver'}</span>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const marker = L.marker([pData.lat, pData.lng], { icon: peerIcon }).addTo(map);
        marker.bindPopup(`
          <div class="peer-popup">
            <b>${pData.name || 'Convoy Peer'}</b><br/>
            Ride: ${pData.vehicle?.make || 'Enthusiast'} ${pData.vehicle?.model || 'Ride'}<br/>
            Speed: ${peerSpeed} km/h
          </div>
        `);
        peerMarkersRef.current[peerId] = marker;
      }
    });
  }, [getLeaflet, participantLocations, user]);

  // Render Live Hazards on the Map
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map || !alerts) return;

    alerts.forEach((alert) => {
      const alertId = alert._id;
      if (hazardMarkersRef.current[alertId]) return; // already rendered

      const [lng, lat] = alert.location.coordinates;
      const color = HAZARD_MAP_COLORS[alert.alert_type] || '#ff3860';

      const hazardIcon = L.divIcon({
        className: 'hazard-map-marker',
        html: `
          <div class="hazard-pin" style="background-color: ${color}; border: 2px solid #fff; box-shadow: 0 0 10px ${color}">
            <span>⚠️</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon: hazardIcon }).addTo(map);
      marker.bindPopup(`
        <div class="hazard-popup">
          <b style="color: ${color}">${(alert.title || alert.alert_type).toUpperCase()}</b>
          <p>${alert.description || 'Reported ahead by convoy intelligence'}</p>
          ${alert.speed_limit ? `<small>Speed Limit: ${alert.speed_limit}</small><br/>` : ''}
          <small>Confirmations: ${alert.confirmations?.length || 0}</small>
        </div>
      `);

      hazardMarkersRef.current[alertId] = marker;
    });
  }, [alerts, getLeaflet]);

  // Destination Marker
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map || !convoy?.destination?.coordinates) return;

    const [destLng, destLat] = convoy.destination.coordinates;
    const destIcon = L.divIcon({
      className: 'destination-marker',
      html: `<div class="dest-pin">🏁</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    const destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
    destMarker.bindPopup(`<b>Destination: ${convoy.destination.name || 'Finish Line'}</b>`);
  }, [convoy, getLeaflet]);

  const displayedSpeed = unitMph ? Math.round(currentSpeed * 0.621371) : currentSpeed;
  const speedUnit = unitMph ? 'MPH' : 'KM/H';

  const handleFinishDrive = async () => {
    const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    const avgSpeed = currentSpeed > 0 ? currentSpeed * 0.8 : 45;

    await submitDriveStats(convoyId, {
      top_speed_kmh: topSpeedDrive || currentSpeed,
      avg_speed_kmh: avgSpeed,
      distance_km: (avgSpeed * (durationSeconds / 3600)).toFixed(2),
      duration_seconds: durationSeconds,
      harsh_braking_count: harshBrakingCount,
      harsh_accel_count: harshAccelCount,
      convoy_name: convoy?.name
    });

    navigate(`/leaderboard?convoy=${convoyId}`);
  };

  return (
    <div className="map-hud-container">
      {/* Interactive Map Surface */}
      <div ref={mapContainerRef} className="map-surface" id="convoy-map" />

      {/* Top Floating Telemetry & Navigation Cockpit */}
      <div className="hud-top-bar">
        <div className="hud-convoy-chip">
          <span className="live-dot animate-pulse">●</span>
          <span className="convoy-chip-name">{convoy?.name || 'Convoy'}</span>
          <span className="convoy-chip-code">#{convoy?.join_code}</span>
        </div>

        <div className="hud-status-group">
          <button
            className="hud-toggle-unit"
            onClick={() => setUnitMph(!unitMph)}
            title="Toggle Speedometer Units"
          >
            {unitMph ? 'MPH' : 'KM/H'}
          </button>
          <button
            className="btn btn-warning-ghost btn-xs"
            onClick={handleFinishDrive}
          >
            🏁 Finish Drive
          </button>
        </div>
      </div>

      {/* Speedometer & G-Force / Compass HUD Widget */}
      <div className="speedometer-cluster">
        <div className="speed-gauge">
          <div className="speed-dial">
            <span className="speed-value">{displayedSpeed}</span>
            <span className="speed-unit">{speedUnit}</span>
          </div>
          <div className="telemetry-subdata">
            <span>HDG: {heading}°</span>
            <span>TOP: {unitMph ? Math.round(topSpeedDrive * 0.621371) : topSpeedDrive}</span>
          </div>
        </div>
      </div>

      {/* Quick In-Cockpit Hazard Reporter Trigger */}
      <div className="hazard-fab-wrap">
        <button
          className="hazard-fab-btn"
          onClick={() => setShowHazardDrawer(true)}
          title="Report Speed Trap / Camera / Hazard Ahead"
        >
          <span className="fab-icon">🚨</span>
          <span className="fab-label">ALERT</span>
        </button>
      </div>

      {/* Hazard Report Drawer */}
      {showHazardDrawer && (
        <HazardReport
          currentCoords={coords}
          convoyId={convoyId}
          onClose={() => setShowHazardDrawer(false)}
        />
      )}

      {/* Push-to-Talk Non-Interfering Walkie-Talkie Cockpit Floating Control */}
      <WalkieTalkie convoyId={convoyId} />
    </div>
  );
};

ConvoyMapHUD.propTypes = {
  getConvoy: PropTypes.func.isRequired,
  updateTelemetry: PropTypes.func.isRequired,
  receivePeerLocation: PropTypes.func.isRequired,
  getNearbyAlerts: PropTypes.func.isRequired,
  receiveIncomingHazard: PropTypes.func.isRequired,
  submitDriveStats: PropTypes.func.isRequired,
  convoy: PropTypes.object.isRequired,
  hazard: PropTypes.object.isRequired,
  auth: PropTypes.object.isRequired,
  profile: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  convoy: state.convoy,
  hazard: state.hazard,
  auth: state.auth,
  profile: state.profile
});

export default connect(mapStateToProps, {
  getConvoy,
  updateTelemetry,
  receivePeerLocation,
  getNearbyAlerts,
  receiveIncomingHazard,
  submitDriveStats
})(ConvoyMapHUD);
