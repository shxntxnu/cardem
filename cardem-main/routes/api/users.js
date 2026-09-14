const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route    POST api/users
// @desc     Register car/bike enthusiast user
// @access   Public
router.post(
  '/',
  [
    check('name', 'Driver name is required').not().isEmpty().trim(),
    check('email', 'Please include a valid email address').isEmail().normalizeEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      const cleanName = (name || '').trim();
      const cleanEmail = (email || '').toLowerCase().trim();
      const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Check if username is already taken by another user (case-insensitive)
      let userByName = await User.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') }
      });
      if (userByName) {
        return res.status(400).json({ errors: [{ msg: 'Username is already taken by another driver' }] });
      }

      // Check if email already exists
      let userByEmail = await User.findOne({ email: cleanEmail });
      if (userByEmail) {
        return res.status(400).json({ errors: [{ msg: 'An account with this email already exists' }] });
      }

      // Gravatar default avatar derivation
      const avatar = gravatar.url(cleanEmail, {
        s: '200',
        r: 'pg',
        d: 'retro'
      });

      const user = new User({
        name: cleanName,
        email: cleanEmail,
        avatar,
        password
      });

      // Cryptographic Hashing with bcrypt (Salt factor 10)
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Helper to generate a unique 6-character automotive friend code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let friendCode = '';
      let exists = true;
      while (exists) {
        friendCode = 'CRD-';
        for (let i = 0; i < 6; i++) {
          friendCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const found = await Profile.findOne({ friend_code: friendCode });
        if (!found) exists = false;
      }

      // Automatically create initial profile for new driver
      const profile = new Profile({
        user: user.id,
        handle: user.name,
        friend_code: friendCode,
        garage: [],
        friends: []
      });
      await profile.save();

      // Sign JWT Token
      const payload = {
        user: {
          id: user.id
        }
      };

      const secret = process.env.JWT_SECRET || config.get('jwtSecret');
      const expiresIn = config.has('jwtExpiration') ? config.get('jwtExpiration') : 360000;

      jwt.sign(payload, secret, { expiresIn }, (err, token) => {
        if (err) throw err;
        res.status(201).json({ token });
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    PUT api/users/profile
// @desc     Update logged in user's profile: username, password, avatar preset, driving style & bio
// @access   Private
router.put('/profile', auth, async (req, res) => {
  const {
    name,
    avatar,
    currentPassword,
    newPassword,
    driving_style,
    experience_level,
    bio
  } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // 1. Handle Username Change with Strict Uniqueness Check
    if (name && name.trim() && name.trim() !== user.name) {
      const cleanName = name.trim();
      if (cleanName.length < 2) {
        return res.status(400).json({ errors: [{ msg: 'Username must be at least 2 characters' }] });
      }

      const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const existingUser = await User.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
        _id: { $ne: req.user.id }
      });

      if (existingUser) {
        return res.status(400).json({ errors: [{ msg: 'Username is already taken by another driver' }] });
      }

      user.name = cleanName;
    }

    // 2. Handle Password Change (Current password verified + New password validated)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ errors: [{ msg: 'Current password is required to set a new password' }] });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ errors: [{ msg: 'Current password is incorrect' }] });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ errors: [{ msg: 'New password must be at least 6 characters' }] });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // 3. Handle Preset Avatar Update (Safe Preset badges only - no photo uploads)
    if (avatar && typeof avatar === 'string') {
      user.avatar = avatar;
    }

    await user.save();

    // 4. Synchronize Profile handle and details
    let profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      profile.handle = user.name;
      if (driving_style) profile.driving_style = driving_style;
      if (experience_level) profile.experience_level = experience_level;
      if (bio !== undefined) profile.bio = bio;
      await profile.save();
    }

    // Return sanitized user and updated profile
    const sanitizedUser = {
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      date: user.date
    };

    res.json({
      user: sanitizedUser,
      profile
    });
  } catch (err) {
    console.error('Error updating user profile:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

