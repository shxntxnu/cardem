const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/checkObjectId');
const { check, validationResult } = require('express-validator');

const DriveStats = require('../../models/DriveStats');
const Convoy = require('../../models/Convoy');
const Profile = require('../../models/Profile');

// Calculate safety score heuristic based on dynamic telemetry
function computeSafetyScore(harshAccel, harshBrake, avgSpeed, topSpeed) {
  let score = 100;
  score -= (harshAccel * 2.5);
  score -= (harshBrake * 3.5);

  // Excessive speed variance penalty
  if (topSpeed > 180) score -= 15;
  else if (topSpeed > 140) score -= 8;

  return Math.max(10, Math.min(100, Math.round(score)));
}

// @route    POST api/stats/convoy/:id
// @desc     Log completed drive statistics for a participant
// @access   Private
router.post(
  '/convoy/:id',
  [auth, checkObjectId('id')],
  async (req, res) => {
    const {
      top_speed_kph,
      avg_speed_kph,
      distance_km,
      duration_seconds,
      harsh_accel_events,
      harsh_brake_events,
      route_telemetry
    } = req.body;

    try {
      const convoy = await Convoy.findById(req.params.id);
      if (!convoy) return res.status(404).json({ msg: 'Convoy not found' });

      // Determine vehicle used
      const profile = await Profile.findOne({ user: req.user.id });
      let vehicle = { make: 'Car', model: 'Ride', year: 2024, vehicle_type: 'Car' };
      if (profile && profile.garage && profile.garage.length > 0) {
        const primary = profile.garage.find(v => v.is_primary) || profile.garage[0];
        vehicle = {
          make: primary.make,
          model: primary.model,
          year: primary.year,
          vehicle_type: primary.vehicle_type
        };
      }

      const harshA = Number(harsh_accel_events) || 0;
      const harshB = Number(harsh_brake_events) || 0;
      const topS = Number(top_speed_kph) || 0;
      const avgS = Number(avg_speed_kph) || 0;

      const calculatedSafety = computeSafetyScore(harshA, harshB, avgS, topS);

      // Upsert stats for user in this convoy
      let stats = await DriveStats.findOne({ convoy: req.params.id, user: req.user.id });

      if (stats) {
        stats.top_speed_kph = Math.max(stats.top_speed_kph, topS);
        stats.avg_speed_kph = avgS;
        stats.distance_km = Number(distance_km) || stats.distance_km;
        stats.duration_seconds = Number(duration_seconds) || stats.duration_seconds;
        stats.harsh_accel_events = harshA;
        stats.harsh_brake_events = harshB;
        stats.safety_score = calculatedSafety;
        if (route_telemetry && Array.isArray(route_telemetry)) {
          stats.route_telemetry = route_telemetry;
        }
        await stats.save();
      } else {
        stats = new DriveStats({
          convoy: req.params.id,
          user: req.user.id,
          vehicle,
          top_speed_kph: topS,
          avg_speed_kph: avgS,
          distance_km: Number(distance_km) || 0,
          duration_seconds: Number(duration_seconds) || 0,
          safety_score: calculatedSafety,
          harsh_accel_events: harshA,
          harsh_brake_events: harshB,
          route_telemetry: route_telemetry || []
        });
        await stats.save();
      }

      // Update user's profile stats counters
      if (profile) {
        profile.total_convoys_completed = (profile.total_convoys_completed || 0) + 1;
        // Running average of safety score
        profile.overall_safety_rating = Math.round(
          ((profile.overall_safety_rating || 95) * 0.7) + (calculatedSafety * 0.3)
        );
        await profile.save();
      }

      await stats.populate('user', ['name', 'avatar']);
      res.status(201).json(stats);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/stats/convoy/:id/leaderboard
// @desc     Get aggregated leaderboard for a convoy (Top Speed & Safest Drivers)
// @access   Private
router.get('/convoy/:id/leaderboard', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ msg: 'Convoy not found' });

    const allStats = await DriveStats.find({ convoy: req.params.id })
      .populate('user', ['name', 'avatar']);

    // Rank by Top Speed
    const topSpeedRankings = [...allStats]
      .sort((a, b) => b.top_speed_kph - a.top_speed_kph)
      .map((s, idx) => ({
        rank: idx + 1,
        user: s.user,
        vehicle: s.vehicle,
        top_speed_kph: s.top_speed_kph,
        avg_speed_kph: s.avg_speed_kph
      }));

    // Rank by Safest Driver (highest safety score, lowest harsh braking)
    const safestDriverRankings = [...allStats]
      .sort((a, b) => b.safety_score - a.safety_score || a.harsh_brake_events - b.harsh_brake_events)
      .map((s, idx) => ({
        rank: idx + 1,
        user: s.user,
        vehicle: s.vehicle,
        safety_score: s.safety_score,
        harsh_brake_events: s.harsh_brake_events,
        harsh_accel_events: s.harsh_accel_events
      }));

    // Rank by Total Distance
    const distanceRankings = [...allStats]
      .sort((a, b) => b.distance_km - a.distance_km)
      .map((s, idx) => ({
        rank: idx + 1,
        user: s.user,
        vehicle: s.vehicle,
        distance_km: s.distance_km,
        duration_seconds: s.duration_seconds
      }));

    res.json({
      convoy: {
        id: convoy._id,
        name: convoy.name,
        status: convoy.status,
        participants_count: allStats.length
      },
      leaderboards: {
        topSpeed: topSpeedRankings,
        safestDrivers: safestDriverRankings,
        distance: distanceRankings
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/stats/global/leaderboard
// @desc     Get all-time global platform leaderboards
// @access   Private
router.get('/global/leaderboard', auth, async (req, res) => {
  try {
    const topSpeeds = await DriveStats.find()
      .sort({ top_speed_kph: -1 })
      .limit(10)
      .populate('user', ['name', 'avatar']);

    const safestDrivers = await Profile.find()
      .sort({ overall_safety_rating: -1, total_convoys_completed: -1 })
      .limit(10)
      .populate('user', ['name', 'avatar']);

    res.json({
      topSpeed: topSpeeds.map((s, idx) => ({
        rank: idx + 1,
        user: s.user,
        vehicle: s.vehicle,
        top_speed_kph: s.top_speed_kph
      })),
      safestDrivers: safestDrivers.map((p, idx) => ({
        rank: idx + 1,
        user: p.user,
        safety_rating: p.overall_safety_rating,
        convoys_completed: p.total_convoys_completed
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/stats/me
// @desc     Get personal drive statistics history
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const myStats = await DriveStats.find({ user: req.user.id })
      .sort({ completed_at: -1 })
      .populate('convoy', ['name', 'date', 'status']);

    const totalDistance = myStats.reduce((sum, s) => sum + (s.distance_km || 0), 0);
    const maxSpeedEver = myStats.reduce((max, s) => Math.max(max, s.top_speed_kph || 0), 0);
    const avgSafety = myStats.length > 0
      ? Math.round(myStats.reduce((sum, s) => sum + (s.safety_score || 0), 0) / myStats.length)
      : 95;

    res.json({
      history: myStats,
      summary: {
        total_drives: myStats.length,
        total_distance_km: Math.round(totalDistance * 10) / 10,
        max_speed_kph: maxSpeedEver,
        average_safety_score: avgSafety
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
