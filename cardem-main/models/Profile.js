const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Vehicle year is required']
  },
  vehicle_type: {
    type: String,
    enum: ['Car', 'Motorcycle', 'car', 'motorcycle'],
    default: 'Car'
  },
  nickname: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  horsepower: {
    type: Number
  },
  modifications: [
    {
      type: String,
      trim: true
    }
  ],
  photo: {
    type: String
  },
  is_primary: {
    type: Boolean,
    default: false
  },
  date_added: {
    type: Date,
    default: Date.now
  }
});

const ProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  handle: {
    type: String,
    trim: true
  },
  friend_code: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    trim: true
  },
  friends: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      date_added: {
        type: Date,
        default: Date.now
      }
    }
  ],
  bio: {
    type: String
  },
  location: {
    type: String
  },
  driving_style: {
    type: String,
    enum: ['Cruiser', 'Spirited Driver', 'Canyon Carver', 'Track Day Racer', 'Adventure Rider'],
    default: 'Spirited Driver'
  },
  experience_level: {
    type: String,
    enum: ['Novice', 'Intermediate', 'Advanced', 'Track Expert'],
    default: 'Intermediate'
  },
  garage: [VehicleSchema],
  active_vehicle: {
    type: mongoose.Schema.Types.ObjectId
  },
  social: {
    instagram: { type: String },
    youtube: { type: String },
    twitter: { type: String }
  },
  total_convoys_completed: {
    type: Number,
    default: 0
  },
  overall_safety_rating: {
    type: Number,
    default: 95
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Profile', ProfileSchema);
