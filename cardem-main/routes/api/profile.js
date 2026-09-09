const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const checkObjectId = require('../../middleware/checkObjectId');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const DriveStats = require('../../models/DriveStats');
const HazardAlert = require('../../models/HazardAlert');

// @route    GET api/profile/me
// @desc     Get current authenticated user's profile and garage
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar', 'email']);

    if (!profile) {
      return res.status(404).json({ msg: 'There is no profile for this user' });
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
      color,
      horsepower,
      modifications,
      photo,
      is_primary
    } = req.body;

    const newVehicle = {
      make,
      model,
      year: parseInt(year),
      vehicle_type: vehicle_type === 'Motorcycle' ? 'Motorcycle' : 'Car',
      color: color || '',
      horsepower: horsepower ? parseInt(horsepower) : null,
      modifications: Array.isArray(modifications)
        ? modifications
        : typeof modifications === 'string'
        ? modifications.split(',').map(m => m.trim()).filter(Boolean)
        : [],
      photo: photo || '',
      is_primary: Boolean(is_primary)
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });
      if (!profile) {
        return res.status(404).json({ msg: 'Profile not found. Please create a profile first.' });
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

module.exports = router;
