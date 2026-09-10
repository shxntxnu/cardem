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
import FriendsDrawer from '../friends/FriendsDrawer';
import FriendProfileModal from '../friends/FriendProfileModal';

const ConvoysView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const auth = useSelector((state) => state.auth);
  const profileState = useSelector((state) => state.profile);
  const convoyState = useSelector((state) => state.convoy);

  const { user } = auth;
  const { profile, friends, selectedFriend } = profileState;
  const { convoys } = convoyState;

  const [coords, setCoords] = useState({ lat: 51.5074, lng: -0.1278 });
  const [gpsLocked, setGpsLocked] = useState(false);
  const [showFriendsDrawer, setShowFriendsDrawer] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [convoysDrawerOpen, setConvoysDrawerOpen] = useState(true);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const convoyMarkersRef = useRef({});
  const watchIdRef = useRef(null);

  // Safe Leaflet Loader
  const getLeaflet = useCallback(() => {
    return window.L;
  }, []);

  // Fetch initial profile, friends, and active convoys
  useEffect(() => {
    dispatch(getCurrentProfile());
    dispatch(getFriends());
    dispatch(getActiveConvoys());
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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

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

  // Center on current location
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([coords.lat, coords.lng], 15, { animate: true });
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

  return (
    <div className="convoys-explorer-page animate-fade-in">
      {/* Map Container */}
      <div className="explorer-map-wrapper">
        <div ref={mapContainerRef} className="explorer-leaflet-map" />

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
