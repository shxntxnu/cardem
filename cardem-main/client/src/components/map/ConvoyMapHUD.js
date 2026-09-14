import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getConvoy, updateTelemetry, receivePeerLocation, leaveConvoy } from '../../actions/convoy';
import { getNearbyAlerts, receiveIncomingHazard } from '../../actions/hazard';
import { submitDriveStats } from '../../actions/stats';
import socketService from '../../utils/socketService';
import api from '../../utils/api';
import WalkieTalkie from '../walkie/WalkieTalkie';
import HazardReport from '../alerts/HazardReport';
import DestinationSearch from '../navigation/DestinationSearch';
import NavigationHUD from '../navigation/NavigationHUD';
import {
  fetchOSRMRoute,
  fetchOSRMMultiRoute,
  fetchRoadIntelligence,
  computeRealTimeETA,
  calculateDistanceMeters,
  getDriverColor,
  createWatermarkFreeTileLayer,
  fetchLiveRoadHazards
} from '../../utils/osmNavigationService';

const HAZARD_MAP_COLORS = {
  police: '#ff3860',
  speed_camera_instant: '#ff793f',
  speed_camera_average: '#ffb142',
  instant_camera: '#ff793f',
  average_camera: '#ffb142',
  obstruction: '#f7b731',
  road_closure: '#eb4d4b',
  lane_closure: '#f0932b',
  traffic_density: '#e056fd',
  traffic_lights: '#686de0',
  traffic_light: '#686de0'
};

const ConvoyMapHUD = ({
  getConvoy,
  updateTelemetry,
  receivePeerLocation,
  getNearbyAlerts,
  receiveIncomingHazard,
  submitDriveStats,
  leaveConvoy,
  convoy: { activeConvoy, convoy, participantLocations },
  hazard: { alerts },
  auth: { user },
  profile: { profile }
}) => {
  const { id: convoyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentConvoy = convoy || activeConvoy;
  const incomingDestination = location.state?.destination;
  const autoStartNav = location.state?.autoStartNav;

  // Host leadership identification: only the host can set group routes
  const hostId = (currentConvoy?.host?._id || currentConvoy?.host?.id || currentConvoy?.host)?.toString();
  const currentUserId = (user?._id || user?.id)?.toString();
  const isHost = Boolean(!convoyId || (currentUserId && hostId && currentUserId === hostId));
  const hostName = currentConvoy?.host?.name || 'Convoy Host';

  // Telemetry & GPS State
  const [currentSpeed, setCurrentSpeed] = useState(0); // km/h
  const [topSpeedDrive, setTopSpeedDrive] = useState(0);
  const [heading, setHeading] = useState(0);
  const [coords, setCoords] = useState({ lat: 51.5074, lng: -0.1278 });
  const [unitMph, setUnitMph] = useState(false);
  const [showHazardDrawer, setShowHazardDrawer] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const [harshBrakingCount, setHarshBrakingCount] = useState(0);
  const [harshAccelCount, setHarshAccelCount] = useState(0);

  // Navigation, Multi-Stop Route & Overpass Road Intelligence State
  const [destination, setDestination] = useState(null);
  const [pendingDestination, setPendingDestination] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [isJourneyActive, setIsJourneyActive] = useState(false);
  const [isRouteFinalised, setIsRouteFinalised] = useState(Boolean(currentConvoy?.is_route_finalised));
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const isJourneyActiveRef = useRef(false);
  isJourneyActiveRef.current = isJourneyActive;
  const autoStartHandledRef = useRef(false);

  const [routeSummary, setRouteSummary] = useState('');
  const [, setRouteSteps] = useState([]);
  const [nextStep, setNextStep] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [roadIntel, setRoadIntel] = useState({ speedLimit: 70, highwayClass: 'primary', trafficSignalsCount: 0 });
  const [liveOsmHazards, setLiveOsmHazards] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const [showEndNavPrompt, setShowEndNavPrompt] = useState(false);

  // Global Active Drivers State (Step 3)
  const [onlineDrivers, setOnlineDrivers] = useState([]);

  // Leaflet & DOM Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const communityMarkersRef = useRef({});
  const hazardMarkersRef = useRef({});
  const destinationMarkerRef = useRef(null);
  const waypointMarkersRef = useRef([]);
  const routePolylineRef = useRef(null);
  const watchIdRef = useRef(null);
  const prevSpeedRef = useRef(0);
  const prevTimeRef = useRef(Date.now());

  const userColor = getDriverColor(user?._id);

  const getLeaflet = useCallback(() => {
    return window.L;
  }, []);

  // Initialize Map with OpenStreetMap CartoDB Dark Matter tiles
  useEffect(() => {
    const L = getLeaflet();
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    // OpenStreetMap-powered watermark-free dark automotive tiles for cockpit HUD
    createWatermarkFreeTileLayer(L).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial User Radar Pulse Marker
    const userIcon = L.divIcon({
      className: 'user-map-marker-container',
      html: `
        <div class="user-pulse-marker" style="--user-glow: ${userColor}">
          <div class="marker-core">${profile?.garage?.find((v) => v.is_primary)?.type === 'motorcycle' ? '🏍️' : '🏎️'}</div>
          <div class="marker-pulse" style="border-color: ${userColor}; background: ${userColor}40"></div>
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getLeaflet]);

  // Handle Setting or Calculating Multi-Stop Route from Current Location through all Waypoints
  const handleRenderMultiStopRoute = useCallback(
    async (stopsList, isFromPeer = false) => {
      if (!stopsList || stopsList.length === 0) return;
      const L = getLeaflet();
      const map = mapInstanceRef.current;
      if (!L || !map) return;

      try {
        const targetDest = stopsList[stopsList.length - 1];
        setPendingDestination(targetDest);

        // 1. Fetch road route geometry from OSRM across all waypoints
        const allPoints = [
          { lat: coords.lat, lng: coords.lng, name: 'Current Location' },
          ...stopsList
        ];

        let routeData;
        if (allPoints.length === 2) {
          routeData = await fetchOSRMRoute(coords, targetDest);
        } else {
          routeData = await fetchOSRMMultiRoute(allPoints);
        }

        setRouteSteps(routeData.steps || []);
        setRouteSummary(routeData.summary || '');
        if (routeData.steps && routeData.steps.length > 0) {
          setNextStep(routeData.steps[0]);
        }

        // 2. Query Overpass API along corridor for speed limit & traffic signals
        const intel = await fetchRoadIntelligence(coords.lat, coords.lng, 800);
        setRoadIntel(intel);

        // 3. Compute real-time dynamic ETA
        const eta = computeRealTimeETA({
          distanceMeters: routeData.distanceMeters,
          currentSpeedKph: currentSpeed,
          speedLimitKph: intel.speedLimit,
          trafficSignalsCount: intel.trafficSignalsCount
        });
        setEtaData(eta);

        // 4. Render Distinct Glowing Ideal Route Polyline on the map
        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
          routePolylineRef.current = null;
        }

        const latLngs = routeData.coordinates.map(([lng, lat]) => [lat, lng]);

        // Dual-layer ideal route: outer neon glow casing + vibrant inner highway core
        const glowLine = L.polyline(latLngs, {
          color: userColor || '#00f2fe',
          weight: 12,
          opacity: 0.35,
          lineJoin: 'round',
          lineCap: 'round',
          className: 'ideal-route-glow'
        });

        const coreLine = L.polyline(latLngs, {
          color: userColor || '#00f2fe',
          weight: 5,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
          className: 'ideal-route-core'
        });

        const routeGroup = L.layerGroup([glowLine, coreLine]).addTo(map);
        routePolylineRef.current = routeGroup;

        // Clean up prior waypoint markers
        waypointMarkersRef.current.forEach((marker) => {
          map.removeLayer(marker);
        });
        waypointMarkersRef.current = [];

        if (destinationMarkerRef.current) {
          map.removeLayer(destinationMarkerRef.current);
          destinationMarkerRef.current = null;
        }

        // 5. Render numbered pin markers for each stop in the ordered sequence
        stopsList.forEach((stop, idx) => {
          const isFinal = idx === stopsList.length - 1;
          const stopNumber = idx + 1;

          const wpIcon = L.divIcon({
            className: 'waypoint-map-marker-container',
            html: `
              <div class="waypoint-pulse-wrap ${isFinal ? 'final-stop-pulse' : 'intermediate-stop-pulse'}">
                <div class="waypoint-badge-core">${isFinal && stopsList.length > 1 ? '🏁' : stopNumber}</div>
                <span class="waypoint-badge-label">${stop.name || `Stop ${stopNumber}`}</span>
              </div>
            `,
            iconSize: [36, 42],
            iconAnchor: [18, 38]
          });

          const wpMarker = L.marker([stop.lat, stop.lng], { icon: wpIcon }).addTo(map);
          wpMarker.bindPopup(`
            <div class="waypoint-popup">
              <b>${isFinal ? '🏁 Final Destination' : `📍 Stop ${stopNumber}`}: ${stop.name}</b><br/>
              <span>${stop.display_name || ''}</span>
            </div>
          `);
          waypointMarkersRef.current.push(wpMarker);
        });

        // Auto-fit map to route bounds for full corridor overview
        map.fitBounds(coreLine.getBounds(), { padding: [60, 60], maxZoom: 16 });

        // If host set route in convoy, broadcast to all members immediately (Step 2)
        if (!isFromPeer && convoyId && isHost) {
          socketService.setConvoyDestination(convoyId, targetDest, stopsList);

          // Persist destination and ordered waypoints on backend API
          try {
            await api.put(`/convoys/${convoyId}/destination`, {
              destination_name: targetDest.name,
              destination_coordinates: { lat: targetDest.lat, lng: targetDest.lng },
              waypoints: stopsList.map((w, idx) => ({
                name: w.name,
                display_name: w.display_name || w.name,
                lat: w.lat,
                lng: w.lng,
                order: idx + 1
              }))
            });
          } catch (err) {
            console.warn('Could not persist convoy destination & waypoints:', err.message);
          }
        }
      } catch (err) {
        console.error('Multi-stop route calculation error:', err);
      }
    },
    [convoyId, coords, currentSpeed, getLeaflet, isHost, userColor]
  );

  // Host adds a new waypoint to the sequence
  const handleAddWaypoint = useCallback(
    (place) => {
      if (!place || place.lat === undefined || place.lng === undefined) return;
      const newStop = {
        id: place.place_id || `${Date.now()}_${Math.random()}`,
        name: place.name || 'Waypoint',
        display_name: place.display_name || place.name || '',
        lat: place.lat,
        lng: place.lng
      };

      setWaypoints((prev) => {
        const updated = [...prev, newStop];
        handleRenderMultiStopRoute(updated);
        return updated;
      });
    },
    [handleRenderMultiStopRoute]
  );

  // Host reorders waypoints up or down in the sequence
  const handleMoveWaypoint = useCallback(
    (index, direction) => {
      setWaypoints((prev) => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;
        const updated = [...prev];
        const [movedItem] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, movedItem);
        handleRenderMultiStopRoute(updated);
        return updated;
      });
    },
    [handleRenderMultiStopRoute]
  );

  // Host removes an individual waypoint
  const handleRemoveWaypoint = useCallback(
    (index) => {
      setWaypoints((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        if (updated.length === 0) {
          handleCancelNavigation();
        } else {
          handleRenderMultiStopRoute(updated);
        }
        return updated;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleRenderMultiStopRoute]
  );

  // Step 2 & 3: Host finalises the ordered sequence of stops
  const handleFinaliseRoute = useCallback(async () => {
    if (waypoints.length === 0) return;
    const targetDest = waypoints[waypoints.length - 1];

    setIsRouteFinalised(true);

    if (convoyId && isHost) {
      socketService.finaliseConvoyRoute(convoyId, targetDest, waypoints);
      try {
        await api.put(`/convoys/${convoyId}/finalise-route`);
      } catch (err) {
        console.warn('Could not persist finalised route:', err.message);
      }
    }
  }, [convoyId, isHost, waypoints]);

  // Host unlocks sequence if adjustments are needed
  const handleUnlockRoute = useCallback(() => {
    if (!isHost) return;
    setIsRouteFinalised(false);
  }, [isHost]);

  // Step 3: Once order is finalised, EVERY user in the group can press "Go" to begin drive to first location
  const handleGoJourney = useCallback(() => {
    if (waypoints.length === 0 && !pendingDestination) return;

    // Begin drive to the first location in the finalised sequence
    const firstStop = waypoints.length > 0 ? waypoints[0] : pendingDestination;
    setCurrentStopIndex(0);
    setDestination(firstStop);
    setIsJourneyActive(true);

    const map = mapInstanceRef.current;
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
        map.setView([coords.lat, coords.lng], 17, { animate: true });
      }, 50);
    }
  }, [coords.lat, coords.lng, pendingDestination, waypoints]);

  // Exit turn-by-turn driving HUD: prompts user to confirm ending navigation and return to previous page
  const handleCancelNavigation = useCallback(() => {
    setShowEndNavPrompt(true);
  }, []);

  // Confirmed End of Navigation: returns user to the final page prior to pressing "Go"
  const confirmEndNavigation = useCallback(() => {
    setShowEndNavPrompt(false);
    autoStartHandledRef.current = true;
    setIsJourneyActive(false);
    document.body.classList.remove('nav-mode-active');

    const returnTo = location.state?.returnTo;
    if (returnTo) {
      navigate(returnTo, { replace: true });
    } else {
      // If began navigation directly on map route sequencer, return to that final screen
      navigate(location.pathname, { replace: true, state: {} });
      const map = mapInstanceRef.current;
      if (map) {
        setTimeout(() => {
          map.invalidateSize();
          if (coords?.lat && coords?.lng) {
            map.setView([coords.lat, coords.lng], 15, { animate: true });
          }
        }, 50);
      }
    }
  }, [coords, location.pathname, location.state, navigate]);

  // Completely clear all stops and corridor geometry
  const handleClearAllStops = useCallback(() => {
    autoStartHandledRef.current = true;
    if (location.state?.autoStartNav) {
      navigate(location.pathname, { replace: true, state: {} });
    }

    setDestination(null);
    setPendingDestination(null);
    setWaypoints([]);
    setIsRouteFinalised(false);
    setIsJourneyActive(false);
    document.body.classList.remove('nav-mode-active');
    setRouteSteps([]);
    setNextStep(null);
    setEtaData(null);
    setRouteSummary('');

    const map = mapInstanceRef.current;
    if (map) {
      if (routePolylineRef.current) {
        map.removeLayer(routePolylineRef.current);
        routePolylineRef.current = null;
      }
      if (destinationMarkerRef.current) {
        map.removeLayer(destinationMarkerRef.current);
        destinationMarkerRef.current = null;
      }
      waypointMarkersRef.current.forEach((marker) => {
        map.removeLayer(marker);
      });
      waypointMarkersRef.current = [];
      setTimeout(() => {
        map.invalidateSize();
        map.setView([coords.lat, coords.lng], 15, { animate: true });
      }, 50);
    }
  }, [coords.lat, coords.lng]);

  // Step 3: Cleanly leave convoy from map HUD
  const handleLeaveConvoy = useCallback(() => {
    if (window.confirm('Are you sure you want to leave this convoy?')) {
      leaveConvoy(convoyId, navigate);
    }
  }, [convoyId, leaveConvoy, navigate]);

  // Join Convoy & Setup Sockets for Destination Sync and Global Drivers Presence
  useEffect(() => {
    if (convoyId) {
      getConvoy(convoyId);
    }

    const activeVehicle = profile?.garage?.find((v) => v.is_primary) || profile?.garage?.[0];

    if (convoyId) {
      socketService.joinConvoy(convoyId, {
        _id: user?._id,
        name: user?.name,
        avatar: user?.avatar,
        vehicle: activeVehicle
      });
    }

    // Step 2: Listen for Convoy Destination & Ordered Waypoints Synchronized from Host
    socketService.onConvoyDestinationUpdated((data) => {
      console.log('🎯 Convoy destination & waypoints synced from host:', data);
      if (data.waypoints && Array.isArray(data.waypoints) && data.waypoints.length > 0) {
        setWaypoints(data.waypoints);
        handleRenderMultiStopRoute(data.waypoints, true);
      } else if (data.destination) {
        const dest = data.destination;
        const destObj = {
          name: dest.name || 'Convoy Target',
          display_name: dest.display_name || dest.name || '',
          lat: dest.lat !== undefined ? dest.lat : dest.coordinates[1],
          lng: dest.lng !== undefined ? dest.lng : dest.coordinates[0]
        };
        setWaypoints([destObj]);
        handleRenderMultiStopRoute([destObj], true);
      }
    });

    // Step 3: Listen for Convoy Route Finalised (unlocks group "Go" button)
    socketService.onConvoyRouteFinalised((data) => {
      console.log('🔒 Convoy route finalised synced from host:', data);
      setIsRouteFinalised(true);
      if (data.waypoints && Array.isArray(data.waypoints) && data.waypoints.length > 0) {
        setWaypoints(data.waypoints);
        handleRenderMultiStopRoute(data.waypoints, true);
      }
    });

    // Step 3: Listen for Global Online Drivers updates
    socketService.onGlobalDriversUpdated((driversList) => {
      setOnlineDrivers(driversList || []);
    });

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
  }, [convoyId, getConvoy, handleRenderMultiStopRoute, profile, receiveIncomingHazard, receivePeerLocation, user]);

  // Hydrate destination and waypoints from convoy if already set
  useEffect(() => {
    if (currentConvoy && waypoints.length === 0 && !destination && !pendingDestination) {
      if (currentConvoy.is_route_finalised) {
        setIsRouteFinalised(true);
      }
      if (currentConvoy.waypoints && currentConvoy.waypoints.length > 0) {
        setWaypoints(currentConvoy.waypoints);
        handleRenderMultiStopRoute(currentConvoy.waypoints, true);
      } else {
        const destCoords = currentConvoy.destination_coordinates;
        const destName = currentConvoy.destination_name || currentConvoy.destination?.name;
        if (destCoords && destCoords.lat !== undefined && destCoords.lng !== undefined) {
          const single = {
            name: destName || 'Convoy Target',
            lat: destCoords.lat,
            lng: destCoords.lng
          };
          setWaypoints([single]);
          handleRenderMultiStopRoute([single], true);
        }
      }
    } else if (currentConvoy?.is_route_finalised) {
      setIsRouteFinalised(true);
    }
  }, [currentConvoy, destination, handleRenderMultiStopRoute, pendingDestination, waypoints.length]);

  // Handle incoming destination and auto-start from external links (e.g. ConvoysView or ConvoyLobby)
  useEffect(() => {
    if (incomingDestination && incomingDestination.lat !== undefined && incomingDestination.lng !== undefined) {
      setWaypoints([incomingDestination]);
      handleRenderMultiStopRoute([incomingDestination]);
      if (autoStartNav && !autoStartHandledRef.current) {
        autoStartHandledRef.current = true;
        setDestination(incomingDestination);
        setCurrentStopIndex(0);
        setIsJourneyActive(true);
      }
    }
  }, [incomingDestination, autoStartNav, handleRenderMultiStopRoute]);

  useEffect(() => {
    if (autoStartNav && !autoStartHandledRef.current && !isJourneyActive) {
      if (waypoints.length > 0) {
        autoStartHandledRef.current = true;
        setDestination(waypoints[0]);
        setCurrentStopIndex(0);
        setIsJourneyActive(true);
      } else if (currentConvoy?.waypoints && currentConvoy.waypoints.length > 0) {
        autoStartHandledRef.current = true;
        setDestination(currentConvoy.waypoints[0]);
        setCurrentStopIndex(0);
        setIsJourneyActive(true);
      }
    }
  }, [autoStartNav, currentConvoy, isJourneyActive, waypoints]);

  // Clean Navigation Mode: toggle body class so global app headers/docks are hidden during navigation
  useEffect(() => {
    if (isJourneyActive) {
      document.body.classList.add('nav-mode-active');
    } else {
      document.body.classList.remove('nav-mode-active');
    }
    return () => {
      document.body.classList.remove('nav-mode-active');
    };
  }, [isJourneyActive]);

  // High Precision Geolocation Watcher: streams real-time updates and dynamically recomputes ETA
  useEffect(() => {
    if (!navigator.geolocation) return;

    const options = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000
    };

    const handleSuccess = async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const rawSpeed = position.coords.speed || 0; // m/s
      const speedKmh = Math.max(0, Math.round(rawSpeed * 3.6));
      const head = position.coords.heading || 0;

      const now = Date.now();
      const dt = (now - prevTimeRef.current) / 1000;
      if (dt > 0.5) {
        const dv = rawSpeed - prevSpeedRef.current;
        const accel = dv / dt;
        if (accel > 3.8) setHarshAccelCount((prev) => prev + 1);
        if (accel < -4.5) setHarshBrakingCount((prev) => prev + 1);
        prevSpeedRef.current = rawSpeed;
        prevTimeRef.current = now;
      }

      setCoords({ lat, lng });
      setCurrentSpeed(speedKmh);
      setHeading(Math.round(head));
      if (speedKmh > topSpeedDrive) {
        setTopSpeedDrive(speedKmh);
      }

      // Update User Marker on Map
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      // Step 5: Keep map centered on user during active navigation so rotation happens around user's location
      if (isJourneyActiveRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], 17, { animate: false });
      }

      const activeVehicle = profile?.garage?.find((v) => v.is_primary) || profile?.garage?.[0];

      // Step 3: Global Presence Broadcast (active as long as user is logged in)
      if (user) {
        socketService.sendGlobalPresence({
          user: { id: user._id, name: user.name, avatar: user.avatar },
          vehicle: activeVehicle,
          location: { lat, lng, heading: head, speed: speedKmh }
        });
      }

      // Convoy Telemetry Broadcast
      if (convoyId) {
        updateTelemetry(convoyId, {
          lat,
          lng,
          speed: rawSpeed,
          heading: head,
          vehicle: activeVehicle
        });
      }

      // Real-Time Dynamic ETA recalculation if navigating
      if (destination) {
        const R = 6371e3; // Earth radius in meters
        const phi1 = (lat * Math.PI) / 180;
        const phi2 = (destination.lat * Math.PI) / 180;
        const deltaPhi = ((destination.lat - lat) * Math.PI) / 180;
        const deltaLambda = ((destination.lng - lng) * Math.PI) / 180;
        const a =
          Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const remainingMeters = R * c * 1.25; // 1.25 winding factor

        // Periodically refresh road intelligence via Overpass
        const intel = await fetchRoadIntelligence(lat, lng, 600);
        setRoadIntel(intel);

        const updatedEta = computeRealTimeETA({
          distanceMeters: remainingMeters,
          currentSpeedKph: speedKmh,
          speedLimitKph: intel.speedLimit,
          trafficSignalsCount: intel.trafficSignalsCount
        });
        setEtaData(updatedEta);
      }

      // Step 6: Driver alerts limited to 3000 meter radius during navigation
      getNearbyAlerts(lat, lng, isJourneyActiveRef.current ? 3000 : 15000);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, console.warn, options);

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [convoyId, destination, getNearbyAlerts, profile, topSpeedDrive, updateTelemetry, user]);

  // Step 3: Render All Logged-In Members on the Map
  // Teammates in convoy: Vehicle emoji + glowing ring
  // Other community drivers: Profile avatar circle + username hovering directly above!
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    const activeUserIds = new Set();

    onlineDrivers.forEach((driver) => {
      const uid = driver.userId;
      if (!uid || uid === user?._id) return; // skip self
      if (!driver.location || !driver.location.lat || !driver.location.lng) return;

      activeUserIds.add(uid);
      const isConvoyMate = convoyId && driver.convoyId === convoyId;
      const driverColor = getDriverColor(uid);

      if (communityMarkersRef.current[uid]) {
        // Update existing marker position smoothly
        communityMarkersRef.current[uid].setLatLng([driver.location.lat, driver.location.lng]);
      } else {
        let iconHtml = '';

        if (isConvoyMate) {
          // Teammate marker
          const vehicleEmoji = driver.vehicle?.vehicle_type === 'Motorcycle' ? '🏍️' : '🏎️';
          iconHtml = `
            <div class="convoy-teammate-marker" style="--marker-color: ${driverColor}">
              <div class="teammate-bubble">
                <span class="teammate-icon">${vehicleEmoji}</span>
                <span class="teammate-name">${driver.name?.split(' ')[0] || 'Peer'}</span>
              </div>
              <div class="teammate-ring"></div>
            </div>
          `;
        } else {
          // Other community driver: Profile picture/avatar with username hovering directly above
          const avatarUrl = driver.avatar || 'https://www.gravatar.com/avatar/?d=mp';
          iconHtml = `
            <div class="community-driver-pin">
              <div class="hovering-username-tag">${driver.name || 'Driver'}</div>
              <div class="community-avatar-wrap" style="border-color: ${driverColor}">
                <img src="${avatarUrl}" alt="${driver.name}" class="community-avatar-img" />
              </div>
            </div>
          `;
        }

        const icon = L.divIcon({
          className: 'community-driver-container',
          html: iconHtml,
          iconSize: [48, 54],
          iconAnchor: [24, 48]
        });

        const marker = L.marker([driver.location.lat, driver.location.lng], { icon }).addTo(map);
        marker.bindPopup(`
          <div class="peer-popup">
            <b>${driver.name}</b><br/>
            ${isConvoyMate ? '<span class="text-cyan">⭐ Convoy Teammate</span><br/>' : '<span class="text-dim">🌍 Community Enthusiast</span><br/>'}
            Ride: ${driver.vehicle?.make || 'Enthusiast'} ${driver.vehicle?.model || 'Ride'}<br/>
            Speed: ${Math.round(driver.location.speed || 0)} km/h
          </div>
        `);

        communityMarkersRef.current[uid] = marker;
      }
    });

    // Clean up offline markers
    Object.keys(communityMarkersRef.current).forEach((uid) => {
      if (!activeUserIds.has(uid)) {
        map.removeLayer(communityMarkersRef.current[uid]);
        delete communityMarkersRef.current[uid];
      }
    });
  }, [getLeaflet, onlineDrivers, convoyId, user]);

  // Fetch live road hazards (speed cameras, roadworks, railway crossings) from Overpass API
  useEffect(() => {
    let isMounted = true;
    if (coords && coords.lat) {
      fetchLiveRoadHazards(coords.lat, coords.lng, isJourneyActive ? 3000 : 3500).then((hazards) => {
        if (isMounted) setLiveOsmHazards(hazards);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [coords, isJourneyActive]);

  // Render Live Hazards on the Map (Community Reports + Overpass Live Roadworks/Cameras)
  // Step 6: During navigation mode, driver alerts must be limited to a 3000 meter radius to maximise smoothness
  useEffect(() => {
    const L = getLeaflet();
    const map = mapInstanceRef.current;
    if (!L || !map || !coords || coords.lat === undefined || coords.lng === undefined) return;

    const ALERT_PROXIMITY_RADIUS_METERS = isJourneyActive ? 3000 : 5000;
    const allHazards = [...(alerts || []), ...liveOsmHazards];
    const nearbyHazardIds = new Set();

    allHazards.forEach((alert) => {
      const alertId = alert._id;
      if (!alert.location || !alert.location.coordinates) return;
      const [lng, lat] = alert.location.coordinates;
      const distMeters = calculateDistanceMeters(coords.lat, coords.lng, lat, lng);

      // Only display alerts within localized driving area around user
      if (distMeters <= ALERT_PROXIMITY_RADIUS_METERS) {
        nearbyHazardIds.add(alertId);

        if (hazardMarkersRef.current[alertId]) {
          // Marker already active on map
          return;
        }

        const color = HAZARD_MAP_COLORS[alert.alert_type] || '#ff3860';
        const isOsmLive = alert.source === 'osm_live';

        const hazardIcon = L.divIcon({
          className: 'hazard-map-marker',
          html: `
            <div class="hazard-pin" style="background-color: ${color}; border: 2px solid #fff; box-shadow: 0 0 10px ${color}">
              <span>${alert.alert_type === 'instant_camera' ? '📸' : alert.alert_type === 'road_closure' ? '🚧' : '⚠️'}</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lng], { icon: hazardIcon }).addTo(map);
        marker.bindPopup(`
          <div class="hazard-popup">
            <b style="color: ${color}">${(alert.title || alert.alert_type).toUpperCase()}</b>
            <p>${alert.description || 'Reported ahead by road intelligence'}</p>
            <small class="hazard-dist-tag">📍 ${(distMeters / 1000).toFixed(1)} km away</small><br/>
            ${alert.speed_limit ? `<small>Speed Limit: ${alert.speed_limit}</small><br/>` : ''}
            <small>${isOsmLive ? '📡 Source: OpenStreetMap Live' : `Confirmations: ${alert.confirmations?.length || 0}`}</small>
          </div>
        `);

        hazardMarkersRef.current[alertId] = marker;
      }
    });

    // Remove distant markers that are outside localized proximity to preserve silky smooth performance
    Object.keys(hazardMarkersRef.current).forEach((alertId) => {
      if (!nearbyHazardIds.has(alertId)) {
        map.removeLayer(hazardMarkersRef.current[alertId]);
        delete hazardMarkersRef.current[alertId];
      }
    });
  }, [alerts, liveOsmHazards, getLeaflet, coords, isJourneyActive]);

  // Step 3: Recenter map on user's current GPS position to maintain navigation
  const handleRecenterLocation = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!navigator.geolocation || !map) return;

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const head = position.coords.heading || 0;
        setCoords({ lat, lng });
        setHeading(Math.round(head));

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng]);
        }

        map.flyTo([lat, lng], 16, {
          animate: true,
          duration: 1.2
        });

        setIsLocating(false);
      },
      (err) => {
        console.warn('Recenter location error:', err.message);
        if (coords) {
          map.flyTo([coords.lat, coords.lng], 16, { animate: true, duration: 1.0 });
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, [coords]);

  const handleFinishDrive = async () => {
    const durationSeconds = Math.round((Date.now() - sessionStartTime) / 1000);
    const avgSpeed = currentSpeed > 0 ? currentSpeed * 0.8 : 45;

    if (convoyId) {
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
    } else {
      navigate('/dashboard');
    }
  };

  const displayedSpeed = unitMph ? Math.round(currentSpeed * 0.621371) : currentSpeed;
  const speedUnit = unitMph ? 'MPH' : 'KM/H';
  const validHeading = typeof heading === 'number' && !isNaN(heading) ? heading : 0;

  return (
    <div className={`map-hud-container convoy-map-hud ${isJourneyActive ? 'nav-mode-active' : ''}`} id="convoy-map-hud">
      {/* Interactive OpenStreetMap Surface with Heads-Up Heading Rotation */}
      <div
        ref={mapContainerRef}
        className={`map-surface ${isJourneyActive ? 'is-nav-rotating' : ''}`}
        id="convoy-map"
        style={
          isJourneyActive
            ? {
                transform: `rotate(${-validHeading}deg) scale(1.42)`,
                transformOrigin: '50% 50%',
                '--map-counter-heading': `${validHeading}deg`
              }
            : {
                transform: 'none',
                transformOrigin: '50% 50%',
                '--map-counter-heading': '0deg'
              }
        }
      />

      {/* Floating Nominatim Destination Search Bar (Hidden during active navigation) */}
      {!isJourneyActive && (
        <DestinationSearch
          onSelectDestination={handleAddWaypoint}
          onAddWaypoint={handleAddWaypoint}
          isConvoyActive={Boolean(convoyId)}
          isHost={isHost}
          hostName={hostName}
          isRouteFinalised={isRouteFinalised}
        />
      )}

      {/* Step 1 & 2: Multi-Stop Sequence Planner HUD Card with Host Finalise & Group Go */}
      {(waypoints.length > 0 || pendingDestination) && !isJourneyActive && (
        <div className="route-preview-card route-planner-card animate-slide-up" id="route-planner-card">
          <div className="preview-header-strip">
            <div className="planner-title-group">
              <span className="badge-corridor">⚡ CONVOY ROUTE SEQUENCE</span>
              <span className="stops-count-tag">
                {waypoints.length > 0 ? `${waypoints.length} ${waypoints.length === 1 ? 'Stop' : 'Stops'}` : '1 Stop'}
              </span>
            </div>
            {convoyId && (
              <span className={`badge-role ${isRouteFinalised ? 'role-finalised' : isHost ? 'role-host' : 'role-member'}`}>
                {isRouteFinalised
                  ? '✅ Sequence Finalised'
                  : isHost
                  ? '👑 Host Route Sequence'
                  : `🔒 Route by @${hostName}`}
              </span>
            )}
          </div>

          <div className="preview-content">
            {/* Ordered Waypoints List with Up/Down/Delete controls for host */}
            {waypoints.length > 0 ? (
              <div className="waypoints-sequence-list">
                {waypoints.map((wp, idx) => {
                  const isFinal = idx === waypoints.length - 1;
                  return (
                    <div key={wp.id || idx} className={`waypoint-sequence-item ${isFinal ? 'is-final-item' : ''}`}>
                      <div className="waypoint-num-badge">
                        {isFinal && waypoints.length > 1 ? '🏁' : idx + 1}
                      </div>
                      <div className="waypoint-meta">
                        <strong className="wp-name">{wp.name}</strong>
                        {wp.display_name && <span className="wp-sub">{wp.display_name}</span>}
                      </div>

                      {/* Reordering is host-only and locked once sequence is finalised */}
                      {isHost && !isRouteFinalised && (
                        <div className="waypoint-item-controls">
                          <button
                            className="btn-wp-reorder"
                            onClick={() => handleMoveWaypoint(idx, 'up')}
                            disabled={idx === 0}
                            title="Move stop earlier in sequence"
                          >
                            ⬆️
                          </button>
                          <button
                            className="btn-wp-reorder"
                            onClick={() => handleMoveWaypoint(idx, 'down')}
                            disabled={idx === waypoints.length - 1}
                            title="Move stop later in sequence"
                          >
                            ⬇️
                          </button>
                          <button
                            className="btn-wp-remove"
                            onClick={() => handleRemoveWaypoint(idx)}
                            title="Remove stop"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : pendingDestination ? (
              <div className="preview-dest-title-row">
                <span className="preview-flag">🏁</span>
                <div className="preview-dest-meta">
                  <h3 className="preview-dest-name">{pendingDestination.name}</h3>
                  {pendingDestination.display_name && (
                    <p className="preview-dest-address">{pendingDestination.display_name}</p>
                  )}
                </div>
              </div>
            ) : null}

            {etaData && (
              <div className="preview-metrics-grid">
                <div className="metric-cell">
                  <span className="cell-label">TOTAL DISTANCE</span>
                  <span className="cell-val">{etaData.distanceFormatted}</span>
                </div>
                <div className="metric-cell highlight">
                  <span className="cell-label">TOTAL TIME</span>
                  <span className="cell-val">{etaData.etaDurationFormatted}</span>
                </div>
                <div className="metric-cell">
                  <span className="cell-label">FINAL ARRIVAL</span>
                  <span className="cell-val">{etaData.estimatedArrival}</span>
                </div>
                <div className="metric-cell">
                  <span className="cell-label">SPEED LIMIT</span>
                  <span className="cell-val">{roadIntel?.speedLimit || 70} km/h</span>
                </div>
              </div>
            )}

            <div className="preview-actions-row">
              {!convoyId ? (
                /* Solo Navigation: Direct Begin Navigation button */
                <>
                  <button
                    className="btn btn-primary btn-glow btn-go-action"
                    onClick={handleGoJourney}
                    id="btn-go-drive"
                  >
                    🚀 BEGIN NAVIGATION
                  </button>
                  <button
                    className="btn btn-secondary-ghost btn-cancel-preview"
                    onClick={handleClearAllStops}
                    title="Clear destination"
                  >
                    ✕ Clear
                  </button>
                </>
              ) : isRouteFinalised ? (
                /* Convoy Navigation with Finalised Sequence: Group Go */
                <>
                  <button
                    className="btn btn-primary btn-glow btn-go-action"
                    onClick={handleGoJourney}
                    id="btn-go-drive"
                  >
                    🚀 GO (Drive to {waypoints[0]?.name || pendingDestination?.name || 'Stop 1'})
                  </button>
                  {isHost && (
                    <button
                      className="btn btn-secondary-ghost btn-unlock-route"
                      onClick={handleUnlockRoute}
                      title="Re-open sequence to modify stops"
                    >
                      ✏️ Modify Stops
                    </button>
                  )}
                  {isHost && (
                    <button
                      className="btn btn-secondary-ghost btn-cancel-preview"
                      onClick={handleClearAllStops}
                      title="Clear all stops"
                    >
                      ✕ Clear All
                    </button>
                  )}
                </>
              ) : (
                /* Convoy Navigation: Sequence in Planning - Navigation and Finalise are both directly accessible */
                <>
                  <button
                    className="btn btn-primary btn-glow btn-go-action"
                    onClick={handleGoJourney}
                    id="btn-go-drive-immediate"
                  >
                    🚀 {isHost ? 'BEGIN NAVIGATION NOW' : 'ACCEPT & BEGIN DRIVE'}
                  </button>
                  {isHost ? (
                    <button
                      className="btn btn-warning btn-glow btn-finalise-route"
                      onClick={handleFinaliseRoute}
                      id="btn-finalise-route"
                    >
                      🔒 FINALISE FOR GROUP
                    </button>
                  ) : (
                    <div className="waiting-host-notice">
                      <span>⏳ Waiting for host (@{hostName}) to finalise group sequence</span>
                    </div>
                  )}
                  {isHost && (
                    <button
                      className="btn btn-secondary-ghost btn-cancel-preview"
                      onClick={handleClearAllStops}
                      title="Clear all stops"
                    >
                      ✕ Clear
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Real-Time Turn-by-Turn Navigation docked as bottom pop-up below the map */}
      {isJourneyActive && destination && (
        <NavigationHUD
          destinationName={
            waypoints.length > 0
              ? `Stop ${currentStopIndex + 1}: ${waypoints[currentStopIndex]?.name || waypoints[0]?.name}`
              : destination.name
          }
          nextStep={nextStep}
          etaData={etaData}
          routeSummary={routeSummary}
          currentSpeedKph={currentSpeed}
          unitMph={unitMph}
          onCancelNavigation={handleCancelNavigation}
        />
      )}

      {/* Top Floating Cockpit Status Strip (Hidden during active navigation) */}
      {!isJourneyActive && (
        <div className="hud-top-bar">
          {convoyId && (
            <div className="hud-convoy-chip">
              <span className="live-dot animate-pulse">●</span>
              <span className="convoy-chip-name">{convoy?.name || 'Convoy'}</span>
              <span className="convoy-chip-code">#{convoy?.join_code}</span>
            </div>
          )}

          <div className="hud-status-group">
            <button
              className="hud-toggle-unit"
              onClick={() => setUnitMph(!unitMph)}
              title="Toggle Speedometer Units"
            >
              {unitMph ? 'MPH' : 'KM/H'}
            </button>
            {convoyId && (
              <button
                className="btn btn-danger-ghost btn-xs btn-leave-hud"
                onClick={handleLeaveConvoy}
                title="Leave this Convoy"
              >
                🚪 Leave Convoy
              </button>
            )}
            <button className="btn btn-warning-ghost btn-xs" onClick={handleFinishDrive}>
              🏁 Finish Drive
            </button>
          </div>
        </div>
      )}

      {/* Speedometer Cluster (hidden during active navigation mode to let bottom Navigation pop-up dominate) */}
      {!isJourneyActive && (
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
      )}

      {/* Road Hazard Action Trigger (Hidden during active navigation) */}
      {!isJourneyActive && (
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
      )}

      {/* Hazard Report Drawer */}
      {!isJourneyActive && showHazardDrawer && (
        <HazardReport
          currentCoords={coords}
          convoyId={convoyId}
          onClose={() => setShowHazardDrawer(false)}
        />
      )}

      {/* Step 3: My Location / Recenter GPS Navigation Button (Hidden during active navigation) */}
      {!isJourneyActive && (
        <div className="recenter-gps-wrap">
          <button
            className={`recenter-gps-btn ${isLocating ? 'is-locating' : ''}`}
            onClick={handleRecenterLocation}
            title="Recenter on current GPS location"
            aria-label="Recenter map on current location"
          >
            <span className="gps-icon">{isLocating ? '⏳' : '🎯'}</span>
            <span className="gps-label">MY LOC</span>
          </button>
        </div>
      )}

      {/* Step 2: Walkie-Talkie Floating Control (Hidden during active navigation) */}
      {convoyId && !isJourneyActive && <WalkieTalkie convoyId={convoyId} position="right" />}

      {/* End Navigation Confirmation Prompt Modal */}
      {showEndNavPrompt && (
        <div className="modal-backdrop animate-fade-in" style={{ zIndex: 10000 }} onClick={() => setShowEndNavPrompt(false)}>
          <div className="hud-card modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🛑 End Navigation</h2>
              <button className="btn-close" onClick={() => setShowEndNavPrompt(false)}>✕</button>
            </div>
            <p className="subtitle mt-2">
              Are you sure you want to end active navigation and return to{' '}
              <strong style={{ color: '#00f2fe' }}>
                {location.state?.returnTo === '/convoys'
                  ? 'Convoys Explorer'
                  : location.state?.returnTo?.startsWith('/convoy/')
                  ? `${convoy?.name || 'Convoy'} Lobby`
                  : 'Route Sequence Planner'}
              </strong>?
            </p>
            <div className="modal-actions mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowEndNavPrompt(false)}
              >
                Continue Driving
              </button>
              <button
                type="button"
                className="btn btn-danger btn-glow"
                onClick={confirmEndNavigation}
                id="btn-confirm-end-navigation"
              >
                🛑 End & Return
              </button>
            </div>
          </div>
        </div>
      )}
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
  leaveConvoy: PropTypes.func.isRequired,
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
  submitDriveStats,
  leaveConvoy
})(ConvoyMapHUD);
