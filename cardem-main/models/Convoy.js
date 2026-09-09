const mongoose = require('mongoose');

const ConvoyParticipantSchema = new mongoose.Schema({
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
  current_location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    heading: { type: Number, default: 0 },
    speed_kph: { type: Number, default: 0 },
    altitude: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }
  },
  last_active: {
    type: Date,
    default: Date.now
  },
  is_speaking: {
    type: Boolean,
    default: false
  }
});

const ConvoySchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Convoy name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  join_code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'active'
  },
  destination_name: {
    type: String,
    trim: true
  },
  destination_coordinates: {
    lat: Number,
    lng: Number
  },
  waypoints: [
    {
      name: String,
      lat: Number,
      lng: Number,
      order: Number
    }
  ],
  participants: [ConvoyParticipantSchema],
  started_at: {
    type: Date,
    default: Date.now
  },
  ended_at: {
    type: Date
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Convoy', ConvoySchema);
