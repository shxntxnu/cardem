const mongoose = require('mongoose');

const HazardAlertSchema = new mongoose.Schema({
  reported_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alert_type: {
    type: String,
    enum: [
      'police',
      'speed_camera_instant',
      'speed_camera_average',
      'obstruction',
      'hazard_on_road',
      'road_closure',
      'lane_closure',
      'traffic_density',
      'traffic_jam',
      'traffic_light',
      'accident',
      'pothole',
      'stopped_vehicle',
      'construction',
      'roadworks',
      'bad_weather'
    ],
    required: true
  },
  title: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    // coordinates: [longitude, latitude] per GeoJSON standard
    coordinates: {
      type: [Number],
      required: true
    }
  },
  road_name: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  speed_limit: {
    type: Number
  },
  confirmations: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: Date, default: Date.now }
    }
  ],
  dismissals: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      date: { type: Date, default: Date.now }
    }
  ],
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours default lifetime
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Enable geospatial queries like $near, $geoWithin, $nearSphere
HazardAlertSchema.index({ location: '2dsphere' });
HazardAlertSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('HazardAlert', HazardAlertSchema);
