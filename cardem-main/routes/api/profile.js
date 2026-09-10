const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/checkObjectId');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const DriveStats = require('../../models/DriveStats');
const HazardAlert = require('../../models/HazardAlert');

// Helper to generate a unique 6-character automotive friend code
async function generateUniqueFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let exists = true;
  while (exists) {
    code = 'CRD-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const found = await Profile.findOne({ friend_code: code });
    if (!found) exists = false;
  }
  return code;
}

// @route    GET api/profile/me
// @desc     Get current authenticated user's profile and garage
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar', 'email'])
      .populate('friends.user', ['name', 'avatar', 'email']);

    if (!profile) {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      const friendCode = await generateUniqueFriendCode();
      profile = new Profile({
        user: req.user.id,
        handle: user.name,
        friend_code: friendCode,
        garage: [],
        friends: []
      });
      await profile.save();
      await profile.populate('user', ['name', 'avatar', 'email']);
    } else if (!profile.friend_code) {
      profile.friend_code = await generateUniqueFriendCode();
      await profile.save();
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  '/',
  auth,
  [
    check('handle', 'Driver handle or nickname is required').not().isEmpty().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      handle,
      bio,
      location,
      driving_style,
      experience_level,
      instagram,
      youtube,
      twitter
    } = req.body;

    // Build profile object
    const profileFields = {
      user: req.user.id,
      handle,
      bio: bio || '',
      location: location || '',
      driving_style: driving_style || 'Spirited Driver',
      experience_level: experience_level || 'Intermediate'
    };

    profileFields.social = {};
    if (instagram) profileFields.social.instagram = instagram;
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;

    try {
      // Upsert pattern with new: true and setDefaultsOnInsert: true
      const profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).populate('user', ['name', 'avatar']);

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/profile
// @desc     Get all driver profiles
// @access   Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', checkObjectId('user_id'), async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(404).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/garage
// @desc     Add a vehicle (Car or Motorcycle) to user's garage
// @access   Private
router.put(
  '/garage',
  auth,
  [
    check('make', 'Vehicle make is required').not().isEmpty().trim(),
    check('model', 'Vehicle model is required').not().isEmpty().trim(),
    check('year', 'Vehicle year must be a valid number').isNumeric()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      make,
      model,
      year,
      vehicle_type,
      type,
      nickname,
      color,
      horsepower,
      modifications,
      mods,
      photo,
      is_primary
    } = req.body;

    const rawType = vehicle_type || type || 'Car';
    const normalizedType = rawType.toString().toLowerCase() === 'motorcycle' ? 'Motorcycle' : 'Car';
    const rawMods = modifications || mods || [];
    const normalizedMods = Array.isArray(rawMods)
      ? rawMods
      : typeof rawMods === 'string'
      ? rawMods.split(',').map((m) => m.trim()).filter(Boolean)
      : [];

    const newVehicle = {
      make,
      model,
      year: parseInt(year),
      vehicle_type: normalizedType,
      nickname: nickname || '',
      color: color || '',
      horsepower: horsepower ? parseInt(horsepower) : null,
      modifications: normalizedMods,
      photo: photo || '',
      is_primary: Boolean(is_primary)
    };

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        const user = await User.findById(req.user.id);
        profile = new Profile({
          user: req.user.id,
          handle: user ? user.name : 'Driver',
          garage: []
        });
      }

      // If set as primary, unmark existing primary vehicles
      if (newVehicle.is_primary) {
        profile.garage.forEach(v => { v.is_primary = false; });
      }

      // Add to beginning of garage array
      profile.garage.unshift(newVehicle);

      // If it's the first vehicle, auto-assign as primary and active
      if (profile.garage.length === 1) {
        profile.garage[0].is_primary = true;
        profile.active_vehicle = profile.garage[0]._id;
      } else if (newVehicle.is_primary) {
        profile.active_vehicle = profile.garage[0]._id;
      }

      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    PUT api/profile/garage/:vehicle_id/primary
// @desc     Set vehicle as primary active ride
// @access   Private
router.put('/garage/:vehicle_id/primary', [auth, checkObjectId('vehicle_id')], async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });

    let found = false;
    profile.garage.forEach(v => {
      if (v._id.toString() === req.params.vehicle_id) {
        v.is_primary = true;
        profile.active_vehicle = v._id;
        found = true;
      } else {
        v.is_primary = false;
      }
    });

    if (!found) {
      return res.status(404).json({ msg: 'Vehicle not found in your garage' });
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile/garage/:vehicle_id
// @desc     Delete vehicle from garage
// @access   Private
router.delete('/garage/:vehicle_id', [auth, checkObjectId('vehicle_id')], async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ msg: 'Profile not found' });

    profile.garage = profile.garage.filter(v => v._id.toString() !== req.params.vehicle_id);

    // If deleted vehicle was primary, assign first remaining vehicle as primary
    if (profile.garage.length > 0 && !profile.garage.some(v => v.is_primary)) {
      profile.garage[0].is_primary = true;
      profile.active_vehicle = profile.garage[0]._id;
    } else if (profile.garage.length === 0) {
      profile.active_vehicle = null;
    }

    await profile.save();
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile
// @desc     Transaction-safe cascading purge of user, profile, stats, and alerts
// @access   Private
router.delete('/', auth, async (req, res) => {
  try {
    await Promise.all([
      DriveStats.deleteMany({ user: req.user.id }),
      HazardAlert.deleteMany({ reported_by: req.user.id }),
      Profile.findOneAndDelete({ user: req.user.id }),
      User.findOneAndDelete({ _id: req.user.id })
    ]);

    res.json({ msg: 'Account and associated records purged successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile/friends/add
// @desc     Add a friend using their unique friend code (CRD-XXXXXX)
// @access   Private
router.post(
  '/friends/add',
  [
    auth,
    [
      check('friend_code', 'Please enter a valid friend code').not().isEmpty().trim()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { friend_code } = req.body;
    const formattedCode = friend_code.toUpperCase().trim();

    try {
      let myProfile = await Profile.findOne({ user: req.user.id });
      if (!myProfile) {
        return res.status(404).json({ msg: 'Your driver profile could not be found' });
      }

      // Check if user is trying to add themselves
      if (myProfile.friend_code === formattedCode) {
        return res.status(400).json({ msg: 'You cannot add your own driver code as a friend' });
      }

      // Find friend profile by unique code
      const friendProfile = await Profile.findOne({ friend_code: formattedCode })
        .populate('user', ['name', 'avatar', 'email']);

      if (!friendProfile) {
        return res.status(404).json({ msg: 'No driver found with this unique friend code' });
      }

      // Check if already friends
      const alreadyFriends = myProfile.friends.some(
        (f) => f.user.toString() === friendProfile.user._id.toString()
      );
      if (alreadyFriends) {
        return res.status(400).json({ msg: `${friendProfile.user.name} is already in your fleet friends` });
      }

      // Form mutual friendship
      myProfile.friends.unshift({ user: friendProfile.user._id });
      await myProfile.save();

      const friendHasMe = friendProfile.friends.some(
        (f) => f.user.toString() === req.user.id
      );
      if (!friendHasMe) {
        friendProfile.friends.unshift({ user: req.user.id });
        await friendProfile.save();
      }

      const primaryVehicle = friendProfile.garage.find((v) => v.is_primary) || friendProfile.garage[0] || null;

      res.status(200).json({
        msg: `🎉 Successfully connected with ${friendProfile.user.name}!`,
        friend: {
          _id: friendProfile._id,
          user: friendProfile.user,
          handle: friendProfile.handle,
          bio: friendProfile.bio,
          location: friendProfile.location,
          driving_style: friendProfile.driving_style,
          experience_level: friendProfile.experience_level,
          primary_vehicle: primaryVehicle,
          vehicles_count: friendProfile.garage.length,
          overall_safety_rating: friendProfile.overall_safety_rating,
          total_convoys_completed: friendProfile.total_convoys_completed
        }
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/profile/friends
// @desc     Get all connected fleet friends with their primary vehicle and status
// @access   Private
router.get('/friends', auth, async (req, res) => {
  try {
    const myProfile = await Profile.findOne({ user: req.user.id });
    if (!myProfile || !myProfile.friends || myProfile.friends.length === 0) {
      return res.json([]);
    }

    const friendUserIds = myProfile.friends.map((f) => f.user);

    const friendProfiles = await Profile.find({ user: { $in: friendUserIds } })
      .populate('user', ['name', 'avatar', 'email']);

    const friendsList = friendProfiles.map((p) => {
      const primaryVehicle = p.garage.find((v) => v.is_primary) || p.garage[0] || null;
      return {
        _id: p._id,
        user: p.user,
        handle: p.handle,
        bio: p.bio,
        location: p.location,
        driving_style: p.driving_style,
        experience_level: p.experience_level,
        primary_vehicle: primaryVehicle,
        vehicles_count: p.garage.length,
        overall_safety_rating: p.overall_safety_rating,
        total_convoys_completed: p.total_convoys_completed
      };
    });

    res.json(friendsList);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile/friends/:friend_user_id
// @desc     Remove a friend by user ID
// @access   Private
router.delete('/friends/:friend_user_id', [auth, checkObjectId('friend_user_id')], async (req, res) => {
  try {
    const myProfile = await Profile.findOne({ user: req.user.id });
    if (!myProfile) return res.status(404).json({ msg: 'Profile not found' });

    myProfile.friends = myProfile.friends.filter(
      (f) => f.user.toString() !== req.params.friend_user_id
    );
    await myProfile.save();

    // Remove reciprocally
    const otherProfile = await Profile.findOne({ user: req.params.friend_user_id });
    if (otherProfile) {
      otherProfile.friends = otherProfile.friends.filter(
        (f) => f.user.toString() !== req.user.id
      );
      await otherProfile.save();
    }

    res.json({ msg: 'Friend removed from fleet', removedUserId: req.params.friend_user_id });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/friends/:friend_user_id
// @desc     Get a specific friend's read-only profile, garage, and vehicle specs
// @access   Private
router.get('/friends/:friend_user_id', [auth, checkObjectId('friend_user_id')], async (req, res) => {
  try {
    const friendProfile = await Profile.findOne({ user: req.params.friend_user_id })
      .populate('user', ['name', 'avatar', 'email']);

    if (!friendProfile) {
      return res.status(404).json({ msg: 'Friend profile not found' });
    }

    res.json(friendProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
