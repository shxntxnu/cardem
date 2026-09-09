const mongoose = require('mongoose');

// Middleware to validate MongoDB ObjectId params before executing DB queries
const checkObjectId = (idToCheck) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[idToCheck])) {
    return res.status(404).json({ msg: 'Resource not found' });
  }
  next();
};

module.exports = checkObjectId;
