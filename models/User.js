// định nghĩa schema người dùng :""))
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  otp: String,
  otpExpires: Date
});

const User = mongoose.model('User', userSchema);
module.exports = User;
