const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
  const dbUri = process.env.MONGO_URI || config.get('mongoURI');

  try {
    const conn = await mongoose.connect(dbUri);
    console.log(`✅ [MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`❌ [MongoDB Connection Error]: ${err.message}`);
    // If in test or development, allow running with warning if DB is temporarily offline
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ [Development Warning]: Server proceeding in degraded offline/in-memory mode.');
    }
  }
};

module.exports = connectDB;
