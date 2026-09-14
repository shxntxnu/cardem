// OpenStreetMap Navigation & Road Intelligence Engine
// Powered by Nominatim (Geocoding), OSRM (Road Routing), and Overpass API (Live Speed Limits & Signals)

// Nominatim destination search with debouncing and User-Agent adherence
export async function searchNominatimDestinations(query) {
  if (!query || query.trim().length < 2) return [];

  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query.trim()
    )}&format=json&addressdetails=1&limit=6`;

    const res = await fetch(endpoint, {
      headers: {
        'Accept-Language': 'en',
        // Comply with OpenStreetMap Nominatim Usage Policy
        'User-Agent': 'CardemEnthusiastConvoyApp/1.0 (https://cardem.io)'
      }
    });

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item) => ({
      place_id: item.place_id,
      name: item.name || item.display_name.split(',')[0],
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || 'place'
    }));
  } catch (err) {
    console.warn('Nominatim search error:', err.message);
    return [];
  }
}

// OSRM Driving Route Calculation: returns road geometry, distance, and turn steps
export async function fetchOSRMRoute(startCoords, destCoords) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM routing request failed');
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No driving route found to this destination');
    }

    const route = data.routes[0];
    const steps = (route.legs && route.legs[0] && route.legs[0].steps) || [];
    const summary =
      (route.legs && route.legs[0] && route.legs[0].summary) ||
      steps.find((s) => s.name && s.name !== 'Road')?.name ||
      'Primary Highway Corridor';

    const distanceKm = (route.distance / 1000).toFixed(1);
    const distanceMiles = ((route.distance / 1000) * 0.621371).toFixed(1);
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));
    const estimatedArrival = new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      distanceMeters: route.distance, // meters
      durationSeconds: route.duration, // base seconds
      distanceKm,
      distanceMiles,
      durationMinutes,
      estimatedArrival,
      summary,
      coordinates: route.geometry.coordinates, // array of [lng, lat]
      steps: steps.map((step) => ({
        instruction: step.maneuver?.type || 'turn',
        modifier: step.maneuver?.modifier || '',
        name: step.name || 'Road',
        distance: step.distance,
        location: step.maneuver?.location // [lng, lat]
      }))
    };
  } catch (err) {
    console.error('OSRM Route error:', err);
    throw err;
  }
}

// Calculate Great-Circle distance in meters between two coordinates (Haversine formula)
export function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  if (lat1 === undefined || lng1 === undefined || lat2 === undefined || lng2 === undefined) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Multi-Waypoint OSRM Driving Route Calculation
// points: array of { lat, lng, name } with at least 2 points
export async function fetchOSRMMultiRoute(points) {
  if (!points || points.length < 2) {
    throw new Error('At least two points are required for multi-stop routing');
  }

  try {
    const coordsParam = points.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM multi-waypoint request failed');
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No driving route found across selected waypoints');
    }

    const route = data.routes[0];
    const legs = route.legs || [];

    // Aggregate all steps across all legs
    const allSteps = [];
    legs.forEach((leg, legIdx) => {
      if (leg.steps && Array.isArray(leg.steps)) {
        leg.steps.forEach((step) => {
          allSteps.push({
            legIndex: legIdx,
            instruction: step.maneuver?.type || 'turn',
            modifier: step.maneuver?.modifier || '',
            name: step.name || 'Road',
            distance: step.distance,
            location: step.maneuver?.location
          });
        });
      }
    });

    const summary =
      legs[0]?.summary ||
      allSteps.find((s) => s.name && s.name !== 'Road')?.name ||
      'Multi-Stop Convoy Corridor';

    const distanceKm = (route.distance / 1000).toFixed(1);
    const distanceMiles = ((route.distance / 1000) * 0.621371).toFixed(1);
    const durationMinutes = Math.max(1, Math.round(route.duration / 60));
    const estimatedArrival = new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      distanceKm,
      distanceMiles,
      durationMinutes,
      estimatedArrival,
      summary,
      coordinates: route.geometry.coordinates, // array of [lng, lat]
      steps: allSteps,
      legsCount: legs.length
    };
  } catch (err) {
    console.error('OSRM Multi-Route error:', err);
    throw err;
  }
}

// Cache for Overpass queries to respect rate limits and keep navigation 60fps responsive
const overpassCache = new Map();

// Overpass API Query: extracts road speed limits (maxspeed), traffic signals, and road classifications
export async function fetchRoadIntelligence(lat, lng, radiusMeters = 500) {
  const cacheKey = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  if (overpassCache.has(cacheKey)) {
    const cached = overpassCache.get(cacheKey);
    if (Date.now() - cached.timestamp < 120000) {
      return cached.data; // 2-minute cache
    }
  }

  // Overpass QL query targeting roads, speed limits, and traffic signals
  const query = `
    [out:json][timeout:10];
    (
      way["highway"]["maxspeed"](around:${radiusMeters}, ${lat}, ${lng});
      node["highway"="traffic_signals"](around:${Math.min(1500, radiusMeters * 2)}, ${lat}, ${lng});
      way["highway"](around:${radiusMeters}, ${lat}, ${lng});
    );
    out tags center 40;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!res.ok) {
      throw new Error(`Overpass API responded with ${res.status}`);
    }

    const data = await res.json();
    const elements = data.elements || [];

    let detectedSpeedLimit = null;
    let highwayClass = 'primary';
    let trafficSignalsCount = 0;

    elements.forEach((el) => {
      if (el.type === 'node' && el.tags && el.tags.highway === 'traffic_signals') {
        trafficSignalsCount++;
      }

      if (el.type === 'way' && el.tags) {
        if (el.tags.maxspeed && !detectedSpeedLimit) {
          const parsed = parseInt(el.tags.maxspeed.replace(/[^0-9]/g, ''), 10);
          if (parsed && !isNaN(parsed)) {
            detectedSpeedLimit = parsed;
          }
        }
        if (el.tags.highway) {
          highwayClass = el.tags.highway;
        }
      }
    });

    // Default speed limits by OpenStreetMap road classification if not explicitly tagged
    if (!detectedSpeedLimit) {
      switch (highwayClass) {
        case 'motorway':
        case 'motorway_link':
          detectedSpeedLimit = 110; // ~70 mph
          break;
        case 'trunk':
        case 'trunk_link':
          detectedSpeedLimit = 90;
          break;
        case 'primary':
          detectedSpeedLimit = 70;
          break;
        case 'secondary':
          detectedSpeedLimit = 60;
          break;
        case 'residential':
        case 'living_street':
          detectedSpeedLimit = 30; // ~20 mph
          break;
        default:
          detectedSpeedLimit = 50;
      }
    }

    const result = {
      speedLimit: detectedSpeedLimit,
      highwayClass,
      trafficSignalsCount: Math.max(trafficSignalsCount, 0),
      timestamp: Date.now()
    };

    overpassCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (err) {
    console.warn('Overpass intelligence warning (using fallback):', err.message);
    return {
      speedLimit: 50,
      highwayClass: 'primary',
      trafficSignalsCount: 1,
      timestamp: Date.now()
    };
  }
}

// Compute constantly updated Dynamic ETA:
// Blends distance remaining, actual telemetry speed, road speed limit, and signals delay
export function computeRealTimeETA({
  distanceMeters,
  currentSpeedKph,
  speedLimitKph,
  trafficSignalsCount
}) {
  const distanceKm = distanceMeters / 1000;

  // Effective cruising speed: if driver is stopped at red light/traffic, blend with speed limit
  const activeSpeed = currentSpeedKph > 15 ? currentSpeedKph : (speedLimitKph || 50) * 0.75;
  const effectiveSpeed = Math.max(20, Math.min(activeSpeed, (speedLimitKph || 70) * 1.15));

  // Base travel time in minutes
  const baseTravelMinutes = (distanceKm / effectiveSpeed) * 60;

  // Real-world traffic signal latency: ~25 seconds average wait per traffic signal ahead
  const signalDelayMinutes = (trafficSignalsCount * 25) / 60;

  const totalMinutes = Math.max(1, Math.round(baseTravelMinutes + signalDelayMinutes));

  // Compute arrival timestamp
  const arrivalDate = new Date(Date.now() + totalMinutes * 60 * 1000);
  const arrivalTime = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return {
    remainingKm: distanceKm.toFixed(1),
    minutesRemaining: totalMinutes,
    arrivalTime,
    speedLimit: speedLimitKph,
    trafficSignalsAhead: trafficSignalsCount
  };
}

// Deterministic high-contrast racing neon colors for different users
const DRIVER_PALETTE = [
  '#00f2fe', // Neon Cyan (Driver Primary)
  '#ff3860', // Racing Red
  '#ffa502', // Tachometer Amber
  '#00e676', // Nitrous Green
  '#9b59b6', // Apex Purple
  '#ff007f', // Cyber Pink
  '#00d2d3', // Turquoise Teal
  '#ff9f43'  // Solar Orange
];

export function getDriverColor(userId) {
  if (!userId) return DRIVER_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DRIVER_PALETTE.length;
  return DRIVER_PALETTE[index];
}

// Factory to generate watermark-free, high-contrast dark automotive tile layer using OpenStreetMap
export function createWatermarkFreeTileLayer(L) {
  // Official OpenStreetMap Foundation Tiles with Dark Automotive Mode Filter (No Carto / No API Keys / Watermark-Free)
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    className: 'dark-map-tiles'
  });
}

// Overpass API Live Road Hazards: Speed cameras, roadworks/construction, level crossings, and road blocks
export async function fetchLiveRoadHazards(lat, lng, radiusMeters = 3500) {
  const query = `
    [out:json][timeout:10];
    (
      node["highway"="speed_camera"](around:${radiusMeters}, ${lat}, ${lng});
      node["highway"="traffic_signals"](around:${Math.min(1500, radiusMeters)}, ${lat}, ${lng});
      way["highway"="construction"](around:${radiusMeters}, ${lat}, ${lng});
      way["construction"](around:${radiusMeters}, ${lat}, ${lng});
      node["railway"="level_crossing"](around:${radiusMeters}, ${lat}, ${lng});
    );
    out tags center 30;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    if (!res.ok) return [];
    const data = await res.json();
    const elements = data.elements || [];

    return elements
      .map((el) => {
        const elLat = el.lat || (el.center && el.center.lat);
        const elLng = el.lon || (el.center && el.center.lon);
        let alertType = 'hazard';
        let title = 'Road Hazard';

        if (el.tags?.highway === 'speed_camera') {
          alertType = 'instant_camera';
          title = el.tags.maxspeed ? `Speed Camera (${el.tags.maxspeed})` : 'Fixed Speed Camera';
        } else if (el.tags?.highway === 'construction' || el.tags?.construction) {
          alertType = 'road_closure';
          title = 'Roadworks Ahead';
        } else if (el.tags?.railway === 'level_crossing') {
          alertType = 'obstruction';
          title = 'Railway Crossing';
        } else if (el.tags?.highway === 'traffic_signals') {
          alertType = 'traffic_light';
          title = 'Traffic Signal';
        }

        return {
          _id: `osm_${el.id}`,
          title,
          alert_type: alertType,
          description: el.tags?.description || el.tags?.name || 'Reported via OpenStreetMap Road Intelligence',
          speed_limit: el.tags?.maxspeed || null,
          location: {
            coordinates: [elLng, elLat]
          },
          source: 'osm_live'
        };
      })
      .filter((h) => h.location.coordinates[0] && h.location.coordinates[1]);
  } catch (err) {
    console.warn('Live hazard query fallback:', err.message);
    return [];
  }
}
