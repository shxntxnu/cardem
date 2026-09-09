const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/checkObjectId');
const { check, validationResult } = require('express-validator');

const Convoy = require('../../models/Convoy');
const Profile = require('../../models/Profile');

// Helper to generate unique 6-character join code
function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// @route    POST api/convoys
// @desc     Create a new group drive convoy session
// @access   Private
router.post(
  '/',
  auth,
  [
    check('name', 'Convoy name is required').not().isEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      destination_name,
      destination_coordinates,
      waypoints
    } = req.body;

    try {
      // Find host profile and active primary vehicle
      const profile = await Profile.findOne({ user: req.user.id });
      let hostVehicle = { make: 'Custom', model: 'Ride', year: 2024, vehicle_type: 'Car' };

      if (profile && profile.garage && profile.garage.length > 0) {
        const primary = profile.garage.find(v => v.is_primary) || profile.garage[0];
        hostVehicle = {
          make: primary.make,
          model: primary.model,
          year: primary.year,
          vehicle_type: primary.vehicle_type
        };
      }

      // Generate unique join code
      let join_code = generateJoinCode();
      while (await Convoy.findOne({ join_code })) {
        join_code = generateJoinCode();
      }

      const newConvoy = new Convoy({
        host: req.user.id,
        name,
        description: description || '',
        join_code,
        destination_name: destination_name || '',
        destination_coordinates: destination_coordinates || null,
        waypoints: waypoints || [],
        participants: [
          {
            user: req.user.id,
            vehicle: hostVehicle,
            current_location: { lat: 0, lng: 0, heading: 0, speed_kph: 0 },
            last_active: new Date()
          }
        ]
      });

      const convoy = await newConvoy.save();
      await convoy.populate('host', ['name', 'avatar']);
      await convoy.populate('participants.user', ['name', 'avatar']);

      res.status(201).json(convoy);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/convoys/active
// @desc     List active public convoys
// @access   Private
router.get('/active', auth, async (req, res) => {
  try {
    const convoys = await Convoy.find({ status: 'active' })
      .sort({ date: -1 })
      .populate('host', ['name', 'avatar'])
      .populate('participants.user', ['name', 'avatar']);

    res.json(convoys);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/convoys/:id
// @desc     Get convoy details and real-time participant positions
// @access   Private
router.get('/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id)
      .populate('host', ['name', 'avatar'])
      .populate('participants.user', ['name', 'avatar']);

    if (!convoy) {
      return res.status(404).json({ msg: 'Convoy not found' });
    }

    res.json(convoy);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/convoys/join
// @desc     Join a convoy via 6-character join code
// @access   Private
router.post(
  '/join',
  auth,
  [
    check('join_code', 'Please enter a valid 6-character join code').isLength({ min: 4 }).trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { join_code } = req.body;

    try {
      const convoy = await Convoy.findOne({ join_code: join_code.toUpperCase().trim() });
      if (!convoy) {
        return res.status(404).json({ msg: 'No active convoy found with this join code' });
      }

      if (convoy.status === 'completed') {
        return res.status(400).json({ msg: 'This convoy drive has already concluded' });
      }

      // Check if user is already a participant
      const alreadyJoined = convoy.participants.some(
        p => p.user.toString() === req.user.id
      );

      if (!alreadyJoined) {
        // Resolve user's active vehicle from profile garage
        const profile = await Profile.findOne({ user: req.user.id });
        let userVehicle = { make: 'Enthusiast', model: 'Vehicle', year: 2024, vehicle_type: 'Car' };

        if (profile && profile.garage && profile.garage.length > 0) {
          const primary = profile.garage.find(v => v.is_primary) || profile.garage[0];
          userVehicle = {
            make: primary.make,
            model: primary.model,
            year: primary.year,
            vehicle_type: primary.vehicle_type
          };
        }

        convoy.participants.push({
          user: req.user.id,
          vehicle: userVehicle,
          current_location: { lat: 0, lng: 0, heading: 0, speed_kph: 0 },
          last_active: new Date()
        });

        await convoy.save();
      }

      await convoy.populate('host', ['name', 'avatar']);
      await convoy.populate('participants.user', ['name', 'avatar']);

      res.json(convoy);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    POST api/convoys/:id/leave
// @desc     Leave a convoy
// @access   Private
router.post('/:id/leave', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ msg: 'Convoy not found' });

    convoy.participants = convoy.participants.filter(
      p => p.user.toString() !== req.user.id
    );

    await convoy.save();
    res.json({ msg: 'Successfully left the convoy' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/convoys/:id/telemetry
// @desc     Update participant's real-time GPS location & speed on the map
// @access   Private
router.put('/:id/telemetry', [auth, checkObjectId('id')], async (req, res) => {
  const { lat, lng, heading, speed_kph, altitude, accuracy } = req.body;

  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ msg: 'Convoy not found' });

    const participant = convoy.participants.find(
      p => p.user.toString() === req.user.id
    );

    if (!participant) {
      return res.status(403).json({ msg: 'You are not a registered participant in this convoy' });
    }

    participant.current_location = {
      lat: Number(lat) || 0,
      lng: Number(lng) || 0,
      heading: Number(heading) || 0,
      speed_kph: Math.max(0, Number(speed_kph) || 0),
      altitude: Number(altitude) || 0,
      accuracy: Number(accuracy) || 0
    };
    participant.last_active = new Date();

    await convoy.save();
    res.json(participant.current_location);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/convoys/:id/status
// @desc     Update convoy status (Host only: complete, pause, resume)
// @access   Private
router.put('/:id/status', [auth, checkObjectId('id')], async (req, res) => {
  const { status } = req.body;

  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ msg: 'Convoy not found' });

    // Verify host authority
    if (convoy.host.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Only the convoy host can change drive status' });
    }

    convoy.status = status;
    if (status === 'completed') {
      convoy.ended_at = new Date();
    }

    await convoy.save();
    res.json(convoy);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
