const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  location: {
    lat: { type: Number },
    lon: { type: Number }
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  otp: {                 // <-- OTP hash bằng bcrypt
    type: String
  },
  otpExpires: {          // <-- thời gian hết hạn OTP
    type: Date
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
