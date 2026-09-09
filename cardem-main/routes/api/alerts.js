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
  'road_closure',
  'lane_closure',
  'traffic_density',
  'traffic_light',
  'traffic_lights'
];

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

    try {
      const newAlert = new HazardAlert({
        reported_by: req.user.id,
        alert_type,
        title: title || alert_type.toUpperCase().replace(/_/g, ' '),
        description: description || '',
        road_name: road_name || '',
        severity: severity || 'medium',
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

// @route    GET api/alerts/nearby
// @desc     Find road hazard alerts within geospatial proximity
// @access   Private
router.get('/nearby', auth, async (req, res) => {
  const { lat, lng, radius_meters } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ msg: 'Please supply lat and lng query coordinates' });
  }

  const radius = parseInt(radius_meters) || 15000; // default 15km radius

  try {
    const alerts = await HazardAlert.find({
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

    res.json(alerts);
  } catch (err) {
    // If geospatial index is still building or offline mock
    console.warn('Geospatial query fallback:', err.message);
    const fallbackAlerts = await HazardAlert.find({ expires_at: { $gt: new Date() } })
      .populate('reported_by', ['name', 'avatar'])
      .limit(30);
    res.json(fallbackAlerts);
  }
});

// @route    GET api/alerts/recent
// @desc     Get all active recent road alerts
// @access   Private
router.get('/recent', auth, async (req, res) => {
  try {
    const alerts = await HazardAlert.find({ expires_at: { $gt: new Date() } })
      .sort({ created_at: -1 })
      .limit(50)
      .populate('reported_by', ['name', 'avatar']);

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
