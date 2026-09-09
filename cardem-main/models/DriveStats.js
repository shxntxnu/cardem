const mongoose = require('mongoose');

const DriveStatsSchema = new mongoose.Schema({
  convoy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Convoy',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    make: String,
    model: String,
    year: Number,
    vehicle_type: {
      type: String,
      enum: ['Car', 'Motorcycle'],
      default: 'Car'
    }
  },
  top_speed_kph: {
    type: Number,
    default: 0
  },
  avg_speed_kph: {
    type: Number,
    default: 0
  },
  distance_km: {
    type: Number,
    default: 0
  },
  duration_seconds: {
    type: Number,
    default: 0
  },
  safety_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 95
  },
  harsh_accel_events: {
    type: Number,
    default: 0
  },
  harsh_brake_events: {
    type: Number,
    default: 0
  },
  route_telemetry: [
    {
      lat: Number,
      lng: Number,
      speed_kph: Number,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  completed_at: {
    type: Date,
    default: Date.now
  }
});

// Compound index to quickly fetch stats for a specific user in a convoy
DriveStatsSchema.index({ convoy: 1, user: 1 });
DriveStatsSchema.index({ top_speed_kph: -1 });
DriveStatsSchema.index({ safety_score: -1 });

module.exports = mongoose.model('DriveStats', DriveStatsSchema);
