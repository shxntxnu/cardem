const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

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
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      // Gravatar default avatar derivation
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'retro'
      });

      user = new User({
        name,
        email,
        avatar,
        password
      });

      // Cryptographic Hashing with bcrypt (Salt factor 10)
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

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

module.exports = router;
