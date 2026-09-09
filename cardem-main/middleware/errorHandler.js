// Centralized Async Error Handling Middleware
module.exports = function (err, req, res, next) {
  console.error('🔥 [Server Error]:', err.stack || err.message);

  // CastError handling
  if (err.name === 'CastError' || err.kind === 'ObjectId') {
    return res.status(404).json({ msg: 'Resource not found' });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ errors: [{ msg: messages.join(', ') }] });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    msg: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
