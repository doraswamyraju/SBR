const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name']
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false // Exclude password field by default in queries
    },
    role: {
      type: String,
      enum: ['ADMIN', 'AGENT', 'CUSTOMER'],
      default: 'CUSTOMER'
    },
    phone: {
      type: String
    },
    // Customer specific fields
    address: {
      type: String
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    addresses: {
      type: [{
        title: { type: String, required: true },
        addressLine: { type: String, required: true },
        latitude: { type: Number },
        longitude: { type: Number }
      }],
      default: []
    },
    photoUrl: {
      type: String
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    nextServiceDate: {
      type: Date
    },
    // Agent specific fields
    specialization: {
      type: String
    },
    location: {
      type: String
    },
    status: {
      type: String,
      default: 'Offline'
    },
    rating: {
      type: Number,
      default: 0.0
    },
    completedJobs: {
      type: Number,
      default: 0
    },
    currentLat: {
      type: Number
    },
    currentLng: {
      type: Number
    },
    // Notification tokens
    fcmTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Encrypt password using bcrypt before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
