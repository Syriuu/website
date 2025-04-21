const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { sendMail } = require('../mailer');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Hàm tạo mã OTP ngẫu nhiên 6 chữ số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Giới hạn số lần gửi OTP: mỗi IP chỉ được 5 lần trong 15 phút
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
  message: { message: "Đã gửi quá nhiều OTP. Vui lòng thử lại sau 15 phút." }
});

// Bộ nhớ tạm cooldown theo email
const otpCooldowns = {};

// API gửi OTP
router.post('/request-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email không được để trống!" });

  const now = Date.now();
  const lastSent = otpCooldowns[email];
  if (lastSent && now - lastSent < 60 * 1000) {
    const secondsLeft = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
    return res.status(429).json({ message: `Vui lòng đợi ${secondsLeft}s trước khi gửi lại OTP.` });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại!' });

  const otp = generateOTP();
  const hashedOTP = await bcrypt.hash(otp, 10);
  const expires = new Date(Date.now() + 10 * 60000); // Hết hạn sau 10 phút

  user.otp = hashedOTP;
  user.otpExpires = expires;
  await user.save();

  try {
    await sendMail(
      email,
      'Mã OTP đặt lại mật khẩu',
      `Mã OTP của bạn là: ${otp}. OTP có hiệu lực trong 10 phút.`
    );
    otpCooldowns[email] = now;
    res.json({ message: 'OTP đã được gửi tới email!' });
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error);
    res.status(500).json({ message: 'Không thể gửi email. Vui lòng thử lại sau.' });
  }
});

// API đặt lại mật khẩu
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ email, OTP và mật khẩu mới!' });
  }

  const user = await User.findOne({ email });
  if (!user || !user.otp || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn!' });
  }

  const isMatch = await bcrypt.compare(otp.trim(), user.otp);
  if (!isMatch) {
    return res.status(400).json({ message: 'OTP không chính xác!' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: 'Mật khẩu đã được đặt lại thành công!' });
});

module.exports = router;
