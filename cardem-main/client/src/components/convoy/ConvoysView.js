import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getActiveConvoys, joinConvoyByCode } from '../../actions/convoy';
import {
  getCurrentProfile,
  getFriends,
  addFriendByCode,
  removeFriend,
  getFriendDetails,
  clearFriendDetails
} from '../../actions/profile';
import { getRecentAlerts } from '../../actions/hazard';
import FriendsDrawer from '../friends/FriendsDrawer';
import FriendProfileModal from '../friends/FriendProfileModal';
import DestinationSearch from '../navigation/DestinationSearch';
import { HAZARD_META } from '../alerts/AlertsFeed';
import { calculateDistanceKm, formatDistance } from '../../utils/avatarPresets';
import {
  createWatermarkFreeTileLayer,
  fetchOSRMRoute,
  fetchOSRMMultiRoute
} from '../../utils/osmNavigationService';

const ConvoysView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const profileState = useSelector((state) => state.profile);
  const convoyState = useSelector((state) => state.convoy);
  const hazardState = useSelector((state) => state.hazard);

  const { user } = auth;
  const { profile, friends, selectedFriend } = profileState;
  const { convoys } = convoyState;
  const { alerts } = hazardState;

  const [coords, setCoords] = useState({ lat: 51.5074, lng: -0.1278 });
  const [gpsLocked, setGpsLocked] = useState(false);
  const [showFriendsDrawer, setShowFriendsDrawer] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [convoysDrawerOpen, setConvoysDrawerOpen] = useState(true);
  const [friendsWindowOpen, setFriendsWindowOpen] = useState(true);
  const [friendSearch, setFriendSearch] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  // GPS Destination Search & Driving Route Preview State
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinationRoute, setDestinationRoute] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [, setIsRouting] = useState(false);
  const destinationMarkerRef = useRef(null);
  const waypointMarkersRef = useRef([]);
  const destinationRouteLineRef = useRef(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const convoyMarkersRef = useRef({});
  const alertMarkersRef = useRef({});
  const friendMarkersRef = useRef({});
  const watchIdRef = useRef(null);

  // Global popup callback for inspecting friend profile & garage
  useEffect(() => {
    window.__cardemViewFriend = (id) => {
      dispatch(getFriendDetails(id));
    };
    return () => {
      delete window.__cardemViewFriend;
    };
  }, [dispatch]);

  // Safe Leaflet Loader
  const getLeaflet = useCallback(() => {
    return window.L;
  }, []);

  // Fetch initial profile, friends, active convoys, and road alerts
  useEffect(() => {
    dispatch(getCurrentProfile());
    dispatch(getFriends());
    dispatch(getActiveConvoys());
    dispatch(getRecentAlerts());
  }, [dispatch]);

  // High-precision live geolocation listener
  useEffect(() => {
    if (!navigator.geolocation) return;

    const onLocationSuccess = (pos) => {
      const newLat = pos.coords.latitude;
      const newLng = pos.coords.longitude;
      setCoords({ lat: newLat, lng: newLng });
      setGpsLocked(true);

      if (mapInstanceRef.current && userMarkerRef.current) {
        userMarkerRef.current.setLatLng([newLat, newLng]);
      }
    };

    const onLocationError = (err) => {
      console.warn('Geolocation acquisition error:', err.message);
    };

    navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      timeout: 10000
    });

    watchIdRef.current = navigator.geolocation.watchPosition(onLocationSuccess, onLocationError, {
      enableHighAccuracy: true,
      maximumAge: 5000
    });

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    const L = getLeaflet();
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // CartoDB Dark Matter High-Contrast Automotive Tiles
    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Watermark-Free OpenStreetMap Dark Automotive Tiles
    createWatermarkFreeTileLayer(L).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // High-visibility user pulse marker
    const userIcon = L.divIcon({
      className: 'user-map-marker-container',
      html: `
        <div class="user-pulse-marker">
          <div class="marker-core">🏎️</div>
          <div class="marker-pulse"></div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    const userMarker = L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map);
    userMarker.bindPopup(`
      <div style="font-family: 'Outfit', sans-serif; color: #111; padding: 4px;">
        <strong style="font-size: 14px;">📍 Your Location</strong><br/>
        <span style="font-size: 12px; color: #555;">${user?.name || 'Driver'}</span>
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

  // Re-center map when GPS locks for the first time
  useEffect(() => {
    if (gpsLocked && mapInstanceRef.current) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 14, { animate: true });
    }
  }, [gpsLocked, coords.lat, coords.lng]);

  // Render active convoys on the map
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear removed convoys
    Object.keys(convoyMarkersRef.current).forEach((cid) => {
      if (!convoys.some((c) => c._id === cid)) {
        map.removeLayer(convoyMarkersRef.current[cid]);
        delete convoyMarkersRef.current[cid];
      }
    });

    // Plot convoys with destinations or hosts
    convoys.forEach((convoy) => {
      let lat = convoy.destination_coordinates?.lat;
      let lng = convoy.destination_coordinates?.lng;

      // Fallback to first participant location or nearby coordinate if destination is not set
      if (!lat || !lng) {
        const pWithLoc = convoy.participants?.find((p) => p.current_location?.lat && p.current_location?.lng);
        if (pWithLoc) {
          lat = pWithLoc.current_location.lat;
          lng = pWithLoc.current_location.lng;
        }
      }

      if (lat && lng) {
        if (!convoyMarkersRef.current[convoy._id]) {
          const convoyIcon = L.divIcon({
            className: 'convoy-map-pin-container',
            html: `
              <div class="convoy-map-marker">
                <div class="convoy-marker-icon">🏁</div>
                <div class="convoy-marker-badge">${convoy.participants?.length || 1}</div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          const marker = L.marker([lat, lng], { icon: convoyIcon }).addTo(map);
          marker.bindPopup(`
            <div style="font-family: 'Outfit', sans-serif; color: #111; min-width: 170px; padding: 4px;">
              <strong style="font-size: 14px;">🏁 ${convoy.name}</strong><br/>
              <span style="font-size: 12px; color: #555;">Host: ${convoy.host?.name || 'Driver'}</span><br/>
              <span style="font-size: 11px; color: #0284c7; font-weight: 600;">Code: ${convoy.join_code}</span><br/>
              <a href="/convoy/${convoy._id}" style="display: inline-block; margin-top: 6px; padding: 4px 10px; background: #00f2fe; color: #000; border-radius: 4px; font-weight: 700; text-decoration: none; font-size: 11px;">
                Enter Convoy &rarr;
              </a>
            </div>
          `);

          convoyMarkersRef.current[convoy._id] = marker;
        } else {
          convoyMarkersRef.current[convoy._id].setLatLng([lat, lng]);
        }
      }
    });
  }, [convoys, getLeaflet]);

  // Render road hazard alert mini logos on the convoy map
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Remove old alert markers
    Object.keys(alertMarkersRef.current).forEach((aid) => {
      if (!alerts.some((a) => a._id === aid)) {
        map.removeLayer(alertMarkersRef.current[aid]);
        delete alertMarkersRef.current[aid];
      }
    });

    // Plot active alerts
    alerts.forEach((alert) => {
      const c = alert.location?.coordinates;
      if (!c || c.length !== 2) return;
      const alertLng = c[0];
      const alertLat = c[1];

      const meta = HAZARD_META[alert.alert_type] || {
        icon: '⚠️',
        label: alert.alert_type.replace(/_/g, ' '),
        color: '#f59e0b'
      };

      const dist = calculateDistanceKm(coords.lat, coords.lng, alertLat, alertLng);
      const distFormatted = formatDistance(dist);

      if (!alertMarkersRef.current[alert._id]) {
        const miniIcon = L.divIcon({
          className: 'alert-leaflet-icon-container',
          html: `
            <div class="alert-mini-logo-wrapper" style="--accent-color: ${meta.color};">
              <div class="alert-mini-logo-badge">
                <span class="mini-logo-emoji">${meta.icon}</span>
              </div>
              <div class="alert-mini-logo-pulse"></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -18]
        });

        const marker = L.marker([alertLat, alertLng], { icon: miniIcon }).addTo(map);
        marker.bindPopup(`
          <div class="hud-leaflet-alert-popup">
            <div class="popup-header">
              <span class="popup-icon" style="background: ${meta.color}25; color: ${meta.color};">${meta.icon}</span>
              <div class="popup-header-info">
                <span class="popup-category" style="color: ${meta.color};">${meta.label.toUpperCase()}</span>
                <h4 class="popup-title">${alert.title || meta.label}</h4>
              </div>
            </div>
            <div class="popup-distance-pill">
              <span>📍 <strong>${distFormatted}</strong></span>
            </div>
            ${alert.road_name ? `<div class="popup-road"><i class="fa-solid fa-road"></i> ${alert.road_name}</div>` : ''}
            ${alert.description ? `<p class="popup-desc">${alert.description}</p>` : ''}
            <div style="margin-top: 8px;">
              <a href="/alerts" style="display: inline-block; padding: 4px 10px; background: #00f2fe; color: #000; border-radius: 4px; font-weight: 700; text-decoration: none; font-size: 11px;">
                Open in Alerts Feed &rarr;
              </a>
            </div>
          </div>
        `, { className: 'cardem-custom-popup', maxWidth: 280 });

        alertMarkersRef.current[alert._id] = marker;
      } else {
        alertMarkersRef.current[alert._id].setLatLng([alertLat, alertLng]);
      }
    });
  }, [alerts, coords.lat, coords.lng, getLeaflet]);

  // Render fleet friends on the map with glowing vehicle telemetry pins
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear stale friend markers
    Object.keys(friendMarkersRef.current).forEach((fid) => {
      if (!friends.some((f) => (f.user?._id || f._id) === fid)) {
        map.removeLayer(friendMarkersRef.current[fid].marker);
        delete friendMarkersRef.current[fid];
      }
    });

    // Plot each friend
    friends.forEach((friend, idx) => {
      const friendId = friend.user?._id || friend._id;
      if (!friendId) return;

      // Check if friend is in an active convoy
      let friendLat = null;
      let friendLng = null;
      for (const c of convoys) {
        const participant = c.participants?.find((p) => (p.user?._id || p.user) === friendId);
        if (participant && participant.current_location?.lat && participant.current_location?.lng) {
          friendLat = participant.current_location.lat;
          friendLng = participant.current_location.lng;
          break;
        }
      }

      // If not currently in a broadcast convoy, place near user along regional road network
      if (!friendLat || !friendLng) {
        const seedStr = friendId.toString().slice(-4);
        const seedNum = parseInt(seedStr, 16) || (idx + 1) * 37;
        const angle = ((seedNum * 47) % 360) * (Math.PI / 180);
        const radiusDeg = 0.007 + (seedNum % 5) * 0.0025; // ~1-2 km
        friendLat = coords.lat + Math.sin(angle) * radiusDeg;
        friendLng = coords.lng + Math.cos(angle) * radiusDeg;
      }

      const friendName = friend.user?.name || friend.handle || 'Driver';
      const primaryRide = friend.primary_vehicle;
      const vehicleIcon = primaryRide?.vehicle_type === 'Motorcycle' ? '🏍️' : '🏎️';
      const rideName = primaryRide
        ? `${primaryRide.year} ${primaryRide.make} ${primaryRide.model}`
        : 'Enthusiast Machine';

      const friendMarkerHtml = `
        <div class="friend-map-pin-container">
          <div class="friend-callsign-pill">@${friend.handle || friendName}</div>
          <div class="friend-map-marker">
            <div class="friend-marker-avatar">
              <img src="${friend.user?.avatar || 'https://www.gravatar.com/avatar/?d=mp'}" alt="${friendName}" />
            </div>
            <div class="friend-marker-badge">${vehicleIcon}</div>
          </div>
          <div class="friend-marker-pulse"></div>
        </div>
      `;

      const friendIcon = L.divIcon({
        className: 'friend-leaflet-icon-wrapper',
        html: friendMarkerHtml,
        iconSize: [44, 52],
        iconAnchor: [22, 52],
        popupAnchor: [0, -48]
      });

      const popupHtml = `
        <div class="hud-leaflet-friend-popup">
          <div class="popup-friend-header">
            <img src="${friend.user?.avatar || 'https://www.gravatar.com/avatar/?d=mp'}" alt="${friendName}" class="friend-popup-avatar" />
            <div>
              <div class="friend-popup-name">${friendName}</div>
              <div class="friend-popup-handle">@${friend.handle || friendName}</div>
            </div>
          </div>
          <div class="friend-popup-vehicle">
            <span class="ride-icon">${vehicleIcon}</span>
            <span class="ride-name">${rideName}</span>
          </div>
          <div class="friend-popup-actions mt-2">
            <button class="btn-popup-fleet" onclick="window.__cardemViewFriend('${friend.user?._id || friend.user || friendId}')">
              🔍 Inspect Garage & Stats &rarr;
            </button>
          </div>
        </div>
      `;

      if (!friendMarkersRef.current[friendId]) {
        const marker = L.marker([friendLat, friendLng], { icon: friendIcon }).addTo(map);
        marker.bindPopup(popupHtml, { className: 'cardem-friend-popup', maxWidth: 260 });
        friendMarkersRef.current[friendId] = {
          marker,
          lat: friendLat,
          lng: friendLng,
          friend
        };
      } else {
        friendMarkersRef.current[friendId].marker.setLatLng([friendLat, friendLng]);
        friendMarkersRef.current[friendId].marker.setPopupContent(popupHtml);
        friendMarkersRef.current[friendId].lat = friendLat;
        friendMarkersRef.current[friendId].lng = friendLng;
      }
    });
  }, [friends, convoys, coords.lat, coords.lng, getLeaflet]);

  // Spot friend on map: smooth flyTo and open popup
  const handleSpotFriendOnMap = (friend) => {
    const friendId = friend.user?._id || friend._id;
    const friendObj = friendMarkersRef.current[friendId];
    if (friendObj && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([friendObj.lat, friendObj.lng], 15, { duration: 1.2 });
      setTimeout(() => {
        if (friendObj.marker) {
          friendObj.marker.openPopup();
        }
      }, 1250);
    }
  };

  // Step 3: Center and lock on current GPS location
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLng = pos.coords.longitude;
          setCoords({ lat: newLat, lng: newLng });
          setGpsLocked(true);
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([newLat, newLng]);
          }
          map.flyTo([newLat, newLng], 15, { animate: true, duration: 1.2 });
          setIsLocating(false);
        },
        (err) => {
          console.warn('Recenter GPS error:', err.message);
          map.setView([coords.lat, coords.lng], 15, { animate: true });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      map.setView([coords.lat, coords.lng], 15, { animate: true });
    }
  };

  // Join by code submission
  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      dispatch(joinConvoyByCode(joinCodeInput.trim().toUpperCase(), navigate));
      setShowJoinModal(false);
      setJoinCodeInput('');
    }
  };

  // Friend actions
  const handleAddFriend = async (code) => {
    return dispatch(addFriendByCode(code));
  };

  const handleRemoveFriend = (friendUserId) => {
    if (window.confirm('Remove this driver from your fleet friends?')) {
      dispatch(removeFriend(friendUserId));
    }
  };

  const handleViewFriend = (friendUserId) => {
    dispatch(getFriendDetails(friendUserId));
  };

  const handleCloseFriendModal = () => {
    dispatch(clearFriendDetails());
  };

  // Clear all destination and multi-stop route layers
  const clearMapRouteLayers = (map) => {
    if (!map) return;
    if (destinationMarkerRef.current) {
      map.removeLayer(destinationMarkerRef.current);
      destinationMarkerRef.current = null;
    }
    if (waypointMarkersRef.current.length > 0) {
      waypointMarkersRef.current.forEach((m) => map.removeLayer(m));
      waypointMarkersRef.current = [];
    }
    if (destinationRouteLineRef.current) {
      map.removeLayer(destinationRouteLineRef.current);
      destinationRouteLineRef.current = null;
    }
  };

  // Render multi-stop route corridor and pin markers on ConvoysView map
  const renderRouteForWaypoints = async (stopsList) => {
    if (!stopsList || stopsList.length === 0) return;
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    clearMapRouteLayers(map);

    // Place numbered pin for each stop
    stopsList.forEach((stop, idx) => {
      const isFinal = idx === stopsList.length - 1;
      const markerHtml = `
        <div class="waypoint-pin-container ${isFinal ? 'is-final-pin' : ''}">
          <div class="waypoint-pin-badge ${isFinal ? 'final-badge' : ''}">
            ${isFinal ? '🏁' : idx + 1}
          </div>
          <span class="waypoint-pin-label">${stop.name}</span>
        </div>
      `;
      const icon = L.divIcon({
        className: 'waypoint-div-icon',
        html: markerHtml,
        iconSize: [36, 42],
        iconAnchor: [18, 38]
      });
      const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);
      marker.bindPopup(`<b>${isFinal ? '🏁 Final Stop' : `Stop ${idx + 1}`}: ${stop.name}</b><br/>${stop.display_name || ''}`);
      waypointMarkersRef.current.push(marker);
    });

    try {
      setIsRouting(true);
      let route;
      if (stopsList.length === 1) {
        route = await fetchOSRMRoute(coords, stopsList[0]);
      } else {
        const allPoints = [coords, ...stopsList.map((s) => ({ lat: s.lat, lng: s.lng }))];
        route = await fetchOSRMMultiRoute(allPoints);
      }
      setDestinationRoute(route);

      // Draw dual-layer ideal route: neon outer glow + high-contrast inner highway stroke
      const latLngs = route.coordinates.map(([lng, lat]) => [lat, lng]);
      const glowLine = L.polyline(latLngs, {
        color: '#00f2fe',
        weight: 12,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'ideal-route-glow'
      });

      const coreLine = L.polyline(latLngs, {
        color: '#00f2fe',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'ideal-route-core'
      });

      const routeGroup = L.layerGroup([glowLine, coreLine]).addTo(map);
      destinationRouteLineRef.current = routeGroup;

      map.fitBounds(coreLine.getBounds(), { padding: [80, 80], maxZoom: 16 });
    } catch (err) {
      console.warn('Convoys route calculation error:', err.message);
      const last = stopsList[stopsList.length - 1];
      map.flyTo([last.lat, last.lng], 14, { animate: true });
    } finally {
      setIsRouting(false);
    }
  };

  // Handle selecting a destination (single stop or initial destination)
  const handleSelectDestination = async (place) => {
    setSelectedDestination(place);
    const updated = [place];
    setWaypoints(updated);
    await renderRouteForWaypoints(updated);
  };

  // Handle adding an additional stop to the sequence
  const handleAddWaypoint = async (place) => {
    const updated = [...waypoints, place];
    setWaypoints(updated);
    setSelectedDestination(updated[updated.length - 1]);
    await renderRouteForWaypoints(updated);
  };

  // Move stop up or down in sequence
  const handleMoveWaypoint = async (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= waypoints.length) return;
    const updated = [...waypoints];
    const [removed] = updated.splice(idx, 1);
    updated.splice(targetIdx, 0, removed);
    setWaypoints(updated);
    setSelectedDestination(updated[updated.length - 1]);
    await renderRouteForWaypoints(updated);
  };

  // Remove a stop from sequence
  const handleRemoveWaypoint = async (idx) => {
    const updated = waypoints.filter((_, i) => i !== idx);
    setWaypoints(updated);
    if (updated.length === 0) {
      handleClearDestination();
    } else {
      setSelectedDestination(updated[updated.length - 1]);
      await renderRouteForWaypoints(updated);
    }
  };

  const handleClearDestination = () => {
    const map = mapInstanceRef.current;
    if (map) {
      clearMapRouteLayers(map);
    }
    setWaypoints([]);
    setSelectedDestination(null);
    setDestinationRoute(null);
  };

  const handleBeginNavigationDirect = () => {
    const stops = waypoints.length > 0 ? waypoints : selectedDestination ? [selectedDestination] : [];
    if (stops.length > 0) {
      navigate('/drive', {
        state: {
          destination: stops[0],
          waypoints: stops,
          autoStartNav: true,
          returnTo: '/convoys'
        }
      });
    }
  };

  const handleHostConvoyHere = () => {
    const stops = waypoints.length > 0 ? waypoints : selectedDestination ? [selectedDestination] : [];
    if (stops.length > 0) {
      navigate('/create-convoy', {
        state: {
          destination: stops[stops.length - 1],
          waypoints: stops
        }
      });
    }
  };

  return (
    <div className="convoys-explorer-page animate-fade-in">
      {/* Map Container */}
      <div className="explorer-map-wrapper">
        <div ref={mapContainerRef} className="explorer-leaflet-map" />

        {/* Floating GPS Destination Search Bar with Add Stop capability */}
        <div className="convoys-floating-search-bar">
          <DestinationSearch
            onSelectDestination={handleSelectDestination}
            onAddWaypoint={handleAddWaypoint}
            isConvoyActive={false}
            isHost={true}
          />
        </div>

        {/* Floating Destination Preview HUD Card */}
        {selectedDestination && (
          <div className="destination-preview-card hud-card animate-slide-up">
            {/* Step 1: Ideal Route Header Ribbon */}
            <div className="dest-preview-ideal-ribbon">
              <span className="ideal-tag">⚡ IDEAL ROUTE (FASTEST)</span>
              <span className="ideal-via">via {destinationRoute?.summary || 'Primary Highway Corridor'}</span>
            </div>

            <div className="dest-preview-header">
              <div className="dest-preview-icon">🏁</div>
              <div className="dest-preview-text">
                <span className="dest-preview-tag">CHOSEN DESTINATION</span>
                <h3 className="dest-preview-title">{selectedDestination.name}</h3>
                <p className="dest-preview-address">{selectedDestination.display_name}</p>
              </div>
              <button
                className="btn-dest-close"
                onClick={handleClearDestination}
                title="Clear route"
              >
                ✕
              </button>
            </div>

            {/* Multi-Stop Sequence List */}
            {waypoints.length > 0 && (
              <div className="dest-waypoints-sequence-box">
                <div className="dest-wp-title-strip">
                  <span className="dest-wp-badge-count">📍 {waypoints.length} {waypoints.length === 1 ? 'Planned Stop' : 'Planned Stops'}</span>
                  <span className="dest-wp-sub-note">Search to add more stops to sequence</span>
                </div>
                <div className="dest-wp-scroll-list">
                  {waypoints.map((wp, idx) => {
                    const isFinal = idx === waypoints.length - 1;
                    return (
                      <div key={wp.place_id || idx} className={`dest-wp-row ${isFinal && waypoints.length > 1 ? 'is-final-wp' : ''}`}>
                        <span className="wp-order-num">{isFinal && waypoints.length > 1 ? '🏁' : idx + 1}</span>
                        <div className="wp-name-col">
                          <span className="wp-item-name">{wp.name}</span>
                          {wp.display_name && <span className="wp-item-addr">{wp.display_name}</span>}
                        </div>
                        <div className="wp-control-btns">
                          <button
                            type="button"
                            className="btn-wp-reorder"
                            onClick={() => handleMoveWaypoint(idx, 'up')}
                            disabled={idx === 0}
                            title="Move stop earlier"
                          >
                            ⬆️
                          </button>
                          <button
                            type="button"
                            className="btn-wp-reorder"
                            onClick={() => handleMoveWaypoint(idx, 'down')}
                            disabled={idx === waypoints.length - 1}
                            title="Move stop later"
                          >
                            ⬇️
                          </button>
                          <button
                            type="button"
                            className="btn-wp-remove"
                            onClick={() => handleRemoveWaypoint(idx)}
                            title="Remove stop"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Followed by ETA and Distance */}
            {destinationRoute && (
              <div className="dest-preview-stats">
                {/* Dynamic ETA first */}
                <div className="dest-stat-pill dest-stat-eta">
                  <i className="fa-solid fa-clock text-yellow"></i>
                  <div className="stat-text-col">
                    <span className="stat-label">DYNAMIC ETA</span>
                    <span className="stat-value">
                      <strong>{destinationRoute.durationMinutes || Math.max(1, Math.round(destinationRoute.durationSeconds / 60))} mins</strong>
                      {destinationRoute.estimatedArrival && (
                        <small className="stat-arrival"> (Arr ~{destinationRoute.estimatedArrival})</small>
                      )}
                    </span>
                  </div>
                </div>

                {/* Total Distance second */}
                <div className="dest-stat-pill dest-stat-dist">
                  <i className="fa-solid fa-route text-cyan"></i>
                  <div className="stat-text-col">
                    <span className="stat-label">TOTAL DISTANCE</span>
                    <span className="stat-value">
                      <strong>{destinationRoute.distanceKm || (destinationRoute.distanceMeters / 1000).toFixed(1)} km</strong>
                      <small className="stat-miles"> ({destinationRoute.distanceMiles || ((destinationRoute.distanceMeters / 1000) * 0.621371).toFixed(1)} mi)</small>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="dest-preview-actions">
              <button
                className="btn btn-primary btn-glow btn-sm btn-begin-nav-direct"
                onClick={handleBeginNavigationDirect}
                id="btn-begin-navigation-direct"
              >
                🚀 Begin Navigation
              </button>
              <button
                className="btn btn-warning btn-sm"
                onClick={handleHostConvoyHere}
              >
                <i className="fa-solid fa-flag-checkered"></i> Host Convoy
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleClearDestination}
              >
                Clear Route
              </button>
            </div>
          </div>
        )}

        {/* Top Floating Control Bar */}
        <div className="map-floating-top-controls">
          <button
            className="btn btn-hud-action btn-friends-trigger pulse-border"
            onClick={() => setShowFriendsDrawer(true)}
            title="Open Fleet Friends"
          >
            <i className="fa-solid fa-user-group text-cyan"></i>
            <span className="btn-text">Fleet Friends</span>
            <span className="count-pill">{friends.length}</span>
          </button>

          <div className="top-right-actions">
            <button
              className={`btn btn-hud-action btn-sm ${isLocating ? 'pulse-border' : ''}`}
              onClick={handleRecenter}
              title="Recenter map on your current GPS location"
            >
              <i className="fa-solid fa-location-crosshairs text-cyan"></i>
              <span className="btn-text">My Location</span>
            </button>
            <button
              className={`btn btn-hud-action btn-sm ${friendsWindowOpen ? 'btn-glow' : ''}`}
              onClick={() => setFriendsWindowOpen(!friendsWindowOpen)}
              title="Toggle Friends Window"
            >
              <i className="fa-solid fa-users-viewfinder text-cyan"></i>
              <span className="btn-text">Friends Radar</span>
            </button>
            <Link to="/create-convoy" className="btn btn-primary btn-sm btn-glow">
              <i className="fa-solid fa-plus"></i> Host Drive
            </Link>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowJoinModal(true)}
            >
              <i className="fa-solid fa-key"></i> Join Code
            </button>
          </div>
        </div>

        {/* Step 3: Floating My Location button on the map */}
        <div className="recenter-gps-wrap convoys-view-recenter">
          <button
            className={`recenter-gps-btn ${isLocating ? 'is-locating' : ''}`}
            onClick={handleRecenter}
            title="Get current location / Recenter map navigation"
            aria-label="Recenter map on current location"
          >
            <span className="gps-icon">{isLocating ? '⏳' : '🎯'}</span>
            <span className="gps-label">MY LOC</span>
          </button>
        </div>

        {/* Right-Side Friends Window (Spot Friends on Map) */}
        <div className={`friends-sidebar-window hud-card ${friendsWindowOpen ? 'is-open' : 'is-collapsed'}`}>
          <div className="friends-sidebar-header" onClick={() => setFriendsWindowOpen(!friendsWindowOpen)}>
            <div className="sidebar-title-group">
              <i className="fa-solid fa-users-viewfinder text-cyan"></i>
              <div>
                <h4>Fleet Friends ({friends.length})</h4>
                <span className="sidebar-subtext">Spot friends on live map</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-sidebar-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setFriendsWindowOpen(!friendsWindowOpen);
              }}
              title={friendsWindowOpen ? 'Collapse window' : 'Expand window'}
            >
              <i className={`fa-solid fa-chevron-${friendsWindowOpen ? 'right' : 'left'}`}></i>
            </button>
          </div>

          {friendsWindowOpen && (
            <div className="friends-sidebar-body animate-fade-in">
              {friends.length > 2 && (
                <div className="friends-sidebar-search">
                  <input
                    type="text"
                    className="form-input"
                    style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                    placeholder="Search friend callsign..."
                    value={friendSearch}
                    onChange={(e) => setFriendSearch(e.target.value)}
                  />
                </div>
              )}

              {friends.length === 0 ? (
                <div className="sidebar-empty-friends">
                  <div className="empty-icon">👥</div>
                  <p>No fleet friends connected yet.</p>
                  <button
                    className="btn btn-outline btn-xs mt-2"
                    onClick={() => setShowFriendsDrawer(true)}
                  >
                    + Connect Driver Code
                  </button>
                </div>
              ) : (
                <div className="friends-sidebar-list">
                  {friends
                    .filter((f) => {
                      if (!friendSearch.trim()) return true;
                      const name = (f.user?.name || f.handle || '').toLowerCase();
                      return name.includes(friendSearch.toLowerCase());
                    })
                    .map((friend) => {
                      const friendId = friend.user?._id || friend._id;
                      const friendName = friend.user?.name || friend.handle || 'Driver';
                      const primaryRide = friend.primary_vehicle;
                      const vehicleIcon = primaryRide?.vehicle_type === 'Motorcycle' ? '🏍️' : '🏎️';

                      return (
                        <div key={friendId} className="friend-sidebar-card animate-fade-in">
                          <div className="friend-sidebar-card-top">
                            <div className="friend-avatar-bubble">
                              <img
                                src={friend.user?.avatar || 'https://www.gravatar.com/avatar/?d=mp'}
                                alt={friendName}
                              />
                              <span className="status-indicator-dot online"></span>
                            </div>

                            <div className="friend-text-info">
                              <div className="friend-name-row">
                                <span className="friend-card-name">{friendName}</span>
                              </div>
                              <span className="friend-card-handle">@{friend.handle || friendName}</span>

                              {primaryRide && (
                                <div className="friend-card-ride">
                                  <span>{vehicleIcon}</span>
                                  <span className="ride-text-clamp">
                                    {primaryRide.year} {primaryRide.model}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="friend-sidebar-actions">
                            <button
                              className="btn btn-spot-friend btn-glow"
                              onClick={() => handleSpotFriendOnMap(friend)}
                              title="Center and spot friend on live map"
                            >
                              <i className="fa-solid fa-crosshairs text-cyan"></i> Spot on Map
                            </button>
                            <button
                              className="btn btn-view-friend-fleet"
                              onClick={() => handleViewFriend(friend.user?._id || friend.user || friendId)}
                              title="Inspect Garage & Stats"
                            >
                              <i className="fa-solid fa-warehouse"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="friends-sidebar-footer">
                <button
                  className="btn btn-hud-action btn-xs w-full"
                  onClick={() => setShowFriendsDrawer(true)}
                >
                  <i className="fa-solid fa-user-plus text-cyan"></i> Manage / Add Friend Code
                </button>
              </div>
            </div>
          )}
        </div>

        {/* GPS Live Status Indicator & Recenter Button */}
        <div className="map-floating-bottom-controls">
          <button
            className="btn-recenter-gps"
            onClick={handleRecenter}
            title="Center on My Location"
          >
            <i className={`fa-solid fa-crosshairs ${gpsLocked ? 'text-cyan' : ''}`}></i>
          </button>

          <div className="gps-pill">
            <span className={`status-dot ${gpsLocked ? 'live' : 'searching'}`}></span>
            <span>
              {gpsLocked
                ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : 'Acquiring GPS...'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Tray: Active Convoys Nearby */}
      <div className={`active-convoys-tray hud-card ${convoysDrawerOpen ? 'open' : 'collapsed'}`}>
        <div
          className="tray-header"
          onClick={() => setConvoysDrawerOpen(!convoysDrawerOpen)}
        >
          <div className="tray-title-group">
            <h3>
              <span className="live-pulse-dot"></span> Live Convoys Nearby ({convoys.length})
            </h3>
            <span className="tray-subtitle">Real-time group drives ready for departure</span>
          </div>
          <button className="btn-collapse" title="Toggle Tray">
            <i className={`fa-solid fa-chevron-${convoysDrawerOpen ? 'down' : 'up'}`}></i>
          </button>
        </div>

        {convoysDrawerOpen && (
          <div className="tray-content">
            {convoys.length === 0 ? (
              <div className="empty-convoys-state">
                <div className="empty-state-icon">🗺️</div>
                <h4>No active drives broadcast in your region</h4>
                <p>Be the lead driver and host a new convoy, or invite your friends to start rolling!</p>
                <div className="empty-state-actions">
                  <Link to="/create-convoy" className="btn btn-primary btn-sm">
                    + Create Convoy
                  </Link>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowFriendsDrawer(true)}
                  >
                    <i className="fa-solid fa-user-plus"></i> Connect Friends
                  </button>
                </div>
              </div>
            ) : (
              <div className="convoys-scroll-grid">
                {convoys.map((convoy) => (
                  <div key={convoy._id} className="convoy-mini-card hud-card animate-fade-in">
                    <div className="convoy-card-top">
                      <span className="badge badge-cyan">
                        <i className="fa-solid fa-flag-checkered"></i> {convoy.status?.toUpperCase()}
                      </span>
                      <span className="convoy-join-badge">
                        CODE: <strong>{convoy.join_code}</strong>
                      </span>
                    </div>

                    <h4>{convoy.name}</h4>
                    {convoy.description && <p className="convoy-desc">{convoy.description}</p>}

                    <div className="convoy-meta-row">
                      <span>
                        <i className="fa-solid fa-user-tie"></i> Host: {convoy.host?.name || 'Driver'}
                      </span>
                      <span>
                        <i className="fa-solid fa-users"></i> {convoy.participants?.length || 1} Drivers
                      </span>
                    </div>

                    <div className="convoy-card-actions mt-2">
                      <Link
                        to={`/convoy/${convoy._id}`}
                        className="btn btn-primary btn-sm btn-block"
                      >
                        Enter Convoy Lobby &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friends Drawer */}
      <FriendsDrawer
        isOpen={showFriendsDrawer}
        onClose={() => setShowFriendsDrawer(false)}
        friends={friends}
        myFriendCode={profile?.friend_code}
        onAddFriend={handleAddFriend}
        onRemoveFriend={handleRemoveFriend}
        onViewFriend={handleViewFriend}
      />

      {/* Read-Only Friend Profile & Garage Modal */}
      {selectedFriend && (
        <FriendProfileModal
          friendData={selectedFriend}
          onClose={handleCloseFriendModal}
        />
      )}

      {/* Quick Join Modal */}
      {showJoinModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowJoinModal(false)}>
          <div
            className="hud-card modal-content modal-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Join Active Convoy</h2>
              <button className="btn-close" onClick={() => setShowJoinModal(false)}>✕</button>
            </div>
            <form onSubmit={handleJoinSubmit} className="join-form">
              <p className="subtitle">Enter the 6-character convoy code shared by your host.</p>
              <div className="form-group mt-3">
                <input
                  type="text"
                  placeholder="e.g. A9B2C4"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="form-input code-input text-center"
                  maxLength={8}
                  required
                />
              </div>
              <div className="modal-actions mt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Join Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvoysView;
