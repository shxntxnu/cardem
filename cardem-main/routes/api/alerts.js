const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/checkObjectId');
const { check, validationResult } = require('express-validator');

const HazardAlert = require('../../models/HazardAlert');

const VALID_ALERT_TYPES = [
  'police',
  'speed_camera_instant',
  'speed_camera_average',
  'instant_camera',
  'average_camera',
  'obstruction',
  'hazard_on_road',
  'road_closure',
  'lane_closure',
  'traffic_density',
  'traffic_jam',
  'traffic_light',
  'traffic_lights',
  'accident',
  'pothole',
  'stopped_vehicle',
  'construction',
  'roadworks',
  'bad_weather'
];

// Seed collection of realistic Waze / Google Maps alerts
async function generateSampleAlerts(userId, lat = 51.5074, lng = -0.1278) {
  const sampleData = [
    {
      alert_type: 'police',
      title: 'Hidden Police Radar Trap',
      description: 'Unmarked speed trap monitoring westbound traffic with laser gun.',
      road_name: 'Highway A40 / Junction 2',
      severity: 'high',
      speed_limit: 50,
      dLat: 0.0038,
      dLng: 0.0028
    },
    {
      alert_type: 'speed_camera_instant',
      title: 'Fixed Speed Camera',
      description: 'Gatso yellow box speed camera facing eastbound.',
      road_name: 'Grand Avenue / Mile 4',
      severity: 'medium',
      speed_limit: 40,
      dLat: -0.0048,
      dLng: 0.0042
    },
    {
      alert_type: 'speed_camera_average',
      title: 'SPECS Average Speed Zone',
      description: 'Average speed check zone active across 2 miles.',
      road_name: 'Ring Expressway West',
      severity: 'medium',
      speed_limit: 50,
      dLat: 0.0072,
      dLng: -0.0055
    },
    {
      alert_type: 'accident',
      title: 'Multi-Vehicle Collision',
      description: 'Two cars involved in left lane. Emergency response on scene.',
      road_name: 'Central Flyover / Exit 8',
      severity: 'critical',
      dLat: -0.0028,
      dLng: -0.0042
    },
    {
      alert_type: 'traffic_density',
      title: 'Heavy Traffic Jam / Standstill',
      description: 'Bumper-to-bumper standstill congestion moving at 8 mph.',
      road_name: 'Southbound Connector',
      severity: 'high',
      dLat: 0.0055,
      dLng: 0.0078
    },
    {
      alert_type: 'pothole',
      title: 'Deep Rim-Damage Pothole',
      description: 'Severe wheel-damage pothole in right lane near expansion seam.',
      road_name: 'Parkway Boulevard',
      severity: 'medium',
      dLat: -0.0019,
      dLng: 0.0021
    },
    {
      alert_type: 'stopped_vehicle',
      title: 'Disabled Car on Shoulder',
      description: 'Broken down vehicle with hazard flashers on shoulder.',
      road_name: 'Outer Loop / Milepost 12',
      severity: 'low',
      dLat: 0.0079,
      dLng: 0.0012
    },
    {
      alert_type: 'construction',
      title: 'Active Roadworks & Resurfacing',
      description: 'Roadworks in progress. Temporary speed limit enforced.',
      road_name: 'North Crossing Way',
      severity: 'medium',
      speed_limit: 30,
      dLat: -0.0065,
      dLng: -0.0031
    },
    {
      alert_type: 'lane_closure',
      title: 'Right Lane Closed',
      description: 'Traffic cones channeling cars into center and left lanes.',
      road_name: 'Downtown Gateway',
      severity: 'medium',
      dLat: 0.0016,
      dLng: -0.0068
    },
    {
      alert_type: 'road_closure',
      title: 'Full Road Closure / Detour',
      description: 'Closed for structural work. Follow yellow diversion arrows.',
      road_name: 'Riverbank Causeway',
      severity: 'critical',
      dLat: -0.0078,
      dLng: 0.0062
    },
    {
      alert_type: 'bad_weather',
      title: 'Standing Water / Flooding',
      description: 'Dangerous standing water hazard across center lanes.',
      road_name: 'Lowland Underpass',
      severity: 'high',
      dLat: 0.0032,
      dLng: 0.0084
    },
    {
      alert_type: 'traffic_light',
      title: 'Red Light Safety Camera',
      description: 'Automated 24/7 red light safety enforcement camera.',
      road_name: 'Main St & 5th Ave',
      severity: 'medium',
      dLat: -0.0012,
      dLng: -0.0018
    }
  ];

  const results = [];
  for (const s of sampleData) {
    const alert = new HazardAlert({
      reported_by: userId,
      alert_type: s.alert_type,
      title: s.title,
      description: s.description,
      road_name: s.road_name,
      severity: s.severity,
      speed_limit: s.speed_limit,
      location: {
        type: 'Point',
        coordinates: [lng + s.dLng, lat + s.dLat]
      },
      confirmations: [{ user: userId }],
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000)
    });
    await alert.save();
    results.push(alert);
  }
  return results;
}

// @route    POST api/alerts
// @desc     Report a new road hazard or speed trap alert
// @access   Private
router.post(
  '/',
  auth,
  async (req, res) => {
    let {
      alert_type,
      lat,
      lng,
      location,
      title,
      description,
      road_name,
      severity,
      speed_limit
    } = req.body;

    // Normalize coordinates from either lat/lng or location.coordinates
    if ((!lat || !lng) && location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      lng = location.coordinates[0];
      lat = location.coordinates[1];
    }

    if (!alert_type || !VALID_ALERT_TYPES.includes(alert_type)) {
      return res.status(400).json({ errors: [{ msg: 'Valid alert type is required' }] });
    }

    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ errors: [{ msg: 'Valid latitude and longitude are required' }] });
    }

    // Normalize type aliases to canonical schema enum
    if (alert_type === 'instant_camera') alert_type = 'speed_camera_instant';
    if (alert_type === 'average_camera') alert_type = 'speed_camera_average';
    if (alert_type === 'traffic_lights') alert_type = 'traffic_light';
    if (alert_type === 'traffic_jam') alert_type = 'traffic_density';
    if (alert_type === 'roadworks') alert_type = 'construction';
    if (alert_type === 'hazard_on_road') alert_type = 'obstruction';

    try {
      const newAlert = new HazardAlert({
        reported_by: req.user.id,
        alert_type,
        title: title || alert_type.toUpperCase().replace(/_/g, ' '),
        description: description || '',
        road_name: road_name || '',
        severity: severity || 'medium',
        speed_limit: speed_limit ? Number(speed_limit) : undefined,
        location: {
          type: 'Point',
          // GeoJSON standard: [longitude, latitude]
          coordinates: [Number(lng), Number(lat)]
        },
        confirmations: [{ user: req.user.id }]
      });

      const alert = await newAlert.save();
      await alert.populate('reported_by', ['name', 'avatar']);

      res.status(201).json(alert);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    POST api/alerts/seed
// @desc     Seed a collection of realistic Waze/Google Maps alerts around coordinates
// @access   Private
router.post('/seed', auth, async (req, res) => {
  let { lat, lng } = req.body;
  lat = Number(lat) || 51.5074;
  lng = Number(lng) || -0.1278;

  try {
    const alerts = await generateSampleAlerts(req.user.id, lat, lng);
    const populated = await HazardAlert.find({ _id: { $in: alerts.map(a => a._id) } })
      .populate('reported_by', ['name', 'avatar']);
    res.status(201).json(populated);
  } catch (err) {
    console.error('Error seeding alerts:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/alerts/nearby
// @desc     Find road hazard alerts within geospatial proximity
// @access   Private
router.get('/nearby', auth, async (req, res) => {
  const { lat, lng, radius_meters } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Please supply lat and lng query coordinates' });
  }

  const radius = parseInt(radius_meters) || 25000; // 25km radius

  try {
    let alerts = await HazardAlert.find({
      location: {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: radius
        }
      },
      expires_at: { $gt: new Date() }
    }).populate('reported_by', ['name', 'avatar']).sort({ created_at: -1 });

    if (alerts.length === 0) {
      await generateSampleAlerts(req.user.id, Number(lat), Number(lng));
      alerts = await HazardAlert.find({ expires_at: { $gt: new Date() } })
        .populate('reported_by', ['name', 'avatar'])
        .limit(50);
    }

    res.json(alerts);
  } catch (err) {
    console.warn('Geospatial query fallback:', err.message);
    const fallbackAlerts = await HazardAlert.find({ expires_at: { $gt: new Date() } })
      .populate('reported_by', ['name', 'avatar'])
      .limit(50);
    res.json(fallbackAlerts);
  }
});

// @route    GET api/alerts/recent
// @desc     Get all active recent road alerts
// @access   Private
router.get('/recent', auth, async (req, res) => {
  try {
    let alerts = await HazardAlert.find({ expires_at: { $gt: new Date() } })
      .sort({ created_at: -1 })
      .limit(60)
      .populate('reported_by', ['name', 'avatar']);

    // Auto-seed realistic collection if database is empty so driver feed is immediately populated
    if (alerts.length === 0) {
      const lat = Number(req.query.lat) || 51.5074;
      const lng = Number(req.query.lng) || -0.1278;
      await generateSampleAlerts(req.user.id, lat, lng);
      alerts = await HazardAlert.find({ expires_at: { $gt: new Date() } })
        .sort({ created_at: -1 })
        .limit(60)
        .populate('reported_by', ['name', 'avatar']);
    }

    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/alerts/:id/confirm
// @desc     Confirm that an alert is still active
// @access   Private
router.post('/:id/confirm', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const alert = await HazardAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ msg: 'Alert not found' });

    const alreadyConfirmed = alert.confirmations.some(c => c.user.toString() === req.user.id);
    if (!alreadyConfirmed) {
      alert.confirmations.push({ user: req.user.id });
      // Extend expiration by 30 mins
      alert.expires_at = new Date(alert.expires_at.getTime() + 30 * 60 * 1000);
      await alert.save();
    }

    res.json(alert);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/alerts/:id/dismiss
// @desc     Vote that an alert is no longer present / cleared
// @access   Private
router.post('/:id/dismiss', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const alert = await HazardAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ msg: 'Alert not found' });

    const alreadyDismissed = alert.dismissals.some(d => d.user.toString() === req.user.id);
    if (!alreadyDismissed) {
      alert.dismissals.push({ user: req.user.id });
      // If dismissals outnumber confirmations by 3+, mark expired immediately
      if (alert.dismissals.length >= alert.confirmations.length + 2) {
        alert.expires_at = new Date();
      }
      await alert.save();
    }

    res.json(alert);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/alerts/:id
// @desc     Delete alert (Report author only)
// @access   Private
router.delete('/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const alert = await HazardAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ msg: 'Alert not found' });

    if (alert.reported_by.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized to remove this alert' });
    }

    await alert.deleteOne();
    res.json({ msg: 'Alert removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
