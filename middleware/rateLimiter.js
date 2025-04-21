// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 phút
  max: 1,                   // chỉ cho phép 1 request/phút/email
  message: {
    message: "Bạn đang gửi quá nhanh, vui lòng thử lại sau 1 phút."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpLimiter };
