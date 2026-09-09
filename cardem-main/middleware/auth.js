const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // 1. Inspect 'x-auth-token' header
  let token = req.header('x-auth-token');

  // 2. Inspect standard 'Authorization: Bearer <token>' header fallback
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if no token is present
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify JWT signature
  try {
    const secret = process.env.JWT_SECRET || config.get('jwtSecret');
    const decoded = jwt.verify(token, secret);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
