require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { sendMail } = require('./mailer');
const User = require('./models/User');
const friendshipRoutes = require('./models/friendships');
const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/friends', friendshipRoutes);
// Kiểm tra biến môi trường
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI không được định nghĩa trong .env!");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET không được định nghĩa trong .env!");
  process.exit(1);
}

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ Error connecting to MongoDB:', err);
  process.exit(1);
});

// Hàm tạo mã OTP 6 số
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Forgot password - Gửi OTP
const otpCooldowns = {};
app.post('/request-otp', async (req, res) => {
  const { email } = req.body;

  // Kiểm tra cooldown
  const now = Date.now();
  const lastSent = otpCooldowns[email];
  if (lastSent && now - lastSent < 60 * 1000) {
    const secondsLeft = Math.ceil((60 * 1000 - (now - lastSent)) / 1000);
    return res.status(429).json({ message: `Vui lòng đợi ${secondsLeft}s trước khi gửi lại OTP.` });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email không tồn tại!' });

  const otp = generateOTP();
  const expires = new Date(Date.now() + 10 * 60000); // OTP hết hạn sau 10 phút

  user.otp = otp;
  user.otpExpires = expires;
  await user.save();

  try {
    await sendMail(email, 'Mã OTP đặt lại mật khẩu', `Mã OTP của bạn là: ${otp}. OTP có hiệu lực trong 10 phút.`);
    
    otpCooldowns[email] = now; // Lưu thời gian gửi
    res.json({ message: 'OTP đã được gửi tới email!' });
  } catch (error) {
    console.error('❌ Lỗi gửi email:', error);
    res.status(500).json({ message: 'Không thể gửi email. Vui lòng thử lại sau.' });
  }
});


// Reset password bằng OTP
app.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp.trim() || user.otpExpires < new Date()) {
    return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn!' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  res.json({ message: 'Mật khẩu đã được đặt lại thành công!' });
});

// API đăng ký user
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ username, email và password' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username hoặc Email đã tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Đăng ký thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// API đăng nhập user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ username và password' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Sai username hoặc password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Sai username hoặc password' });
    }

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Đăng nhập thành công', token });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Các route trả về HTML
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html')); // Trang mặc định
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.use('/api/friends', friendshipRoutes);

// Chạy server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
