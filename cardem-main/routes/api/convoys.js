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
      destination_name: rawDestName,
      destination_coordinates: rawDestCoords,
      destination,
      waypoints: rawWaypoints
    } = req.body;

    const destination_name = rawDestName || destination?.name || '';
    let destination_coordinates = rawDestCoords || null;
    if (!destination_coordinates && destination?.coordinates && destination.coordinates.length === 2) {
      destination_coordinates = {
        lat: Number(destination.coordinates[1]),
        lng: Number(destination.coordinates[0])
      };
    } else if (!destination_coordinates && req.body.destination_lat && req.body.destination_lng) {
      destination_coordinates = {
        lat: Number(req.body.destination_lat),
        lng: Number(req.body.destination_lng)
      };
    }

    // If waypoints array is provided, use it; otherwise, if a destination was set, seed as stop 1
    let waypoints = rawWaypoints;
    if ((!waypoints || waypoints.length === 0) && destination_name && destination_coordinates) {
      waypoints = [
        {
          name: destination_name,
          lat: destination_coordinates.lat,
          lng: destination_coordinates.lng,
          order: 1
        }
      ];
    }

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
        is_route_finalised: Boolean(waypoints && waypoints.length > 0),
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

    // Safely remove participant regardless of whether user is ObjectId or populated object
    convoy.participants = (convoy.participants || []).filter((p) => {
      const pUserId = (p && p.user && (p.user._id || p.user)) ? (p.user._id || p.user).toString() : null;
      return pUserId && pUserId !== req.user.id;
    });

    const isHost = convoy.host && (convoy.host._id || convoy.host).toString() === req.user.id;
    if (isHost) {
      if (convoy.participants.length > 0) {
        // Transfer host leadership to the next remaining driver
        const nextHost = convoy.participants[0].user;
        convoy.host = nextHost._id || nextHost;
      } else {
        // No participants remain, conclude convoy session gracefully
        convoy.status = 'completed';
        convoy.ended_at = new Date();
      }
    }

    await convoy.save();
    res.json({ msg: 'Successfully left the convoy' });
  } catch (err) {
    console.error('Leave convoy error:', err);
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

// @route    PUT api/convoys/:id/destination
// @desc     Update convoy destination and ordered waypoints for all members
// @access   Private
router.put('/:id/destination', [auth, checkObjectId('id')], async (req, res) => {
  const { destination_name, destination_coordinates, coordinates, waypoints, is_route_finalised } = req.body;

  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ msg: 'Convoy not found' });

    // Step 2: Only the convoy host has the ability to set or change group routes
    const isHost = (convoy.host?._id || convoy.host)?.toString() === req.user.id;
    if (!isHost) {
      return res.status(403).json({ msg: 'Only the convoy host can set or update the destination route for the group' });
    }

    if (is_route_finalised !== undefined) {
      convoy.is_route_finalised = Boolean(is_route_finalised);
    }

    // Persist multi-stop ordered waypoints
    if (waypoints && Array.isArray(waypoints) && waypoints.length > 0) {
      convoy.waypoints = waypoints.map((w, idx) => ({
        name: w.name || `Stop ${idx + 1}`,
        lat: Number(w.lat),
        lng: Number(w.lng),
        order: w.order !== undefined ? Number(w.order) : idx + 1
      }));

      // Final waypoint is the convoy destination
      const finalStop = waypoints[waypoints.length - 1];
      convoy.destination_name = finalStop.name || convoy.destination_name;
      convoy.destination_coordinates = {
        lat: Number(finalStop.lat),
        lng: Number(finalStop.lng)
      };
    } else {
      let lat;
      let lng;
      if (destination_coordinates) {
        lat = destination_coordinates.lat;
        lng = destination_coordinates.lng;
      } else if (coordinates && Array.isArray(coordinates)) {
        lng = coordinates[0];
        lat = coordinates[1];
      }

      if (destination_name) convoy.destination_name = destination_name;
      if (lat !== undefined && lng !== undefined) {
        convoy.destination_coordinates = { lat: Number(lat), lng: Number(lng) };
      }
    }

    await convoy.save();
    await convoy.populate('host', ['name', 'avatar']);
    await convoy.populate('participants.user', ['name', 'avatar']);

    res.json(convoy);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/convoys/:id/finalise-route
// @desc     Host finalises route sequence to unlock group "Go" button
// @access   Private
router.put('/:id/finalise-route', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const convoy = await Convoy.findById(req.params.id);
    if (!convoy) return res.status(404).json({ msg: 'Convoy not found' });

    const isHost = (convoy.host?._id || convoy.host)?.toString() === req.user.id;
    if (!isHost) {
      return res.status(403).json({ msg: 'Only the convoy host can finalise the route sequence' });
    }

    convoy.is_route_finalised = true;
    await convoy.save();
    await convoy.populate('host', ['name', 'avatar']);
    await convoy.populate('participants.user', ['name', 'avatar']);

    res.json(convoy);
  } catch (err) {
    console.error('Finalise route error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
