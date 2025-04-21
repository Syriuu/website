require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const User = require('./models/User');
const friendshipRoutes = require('./routes/friendships.js');
const otpRoutes = require('./routes/otp');
const app = express();
console.log('friendshipRoutes:', typeof friendshipRoutes); // => phải ra: function
console.log('otpRoutes:', typeof otpRoutes);               // => phải ra: function

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/friendships', friendshipRoutes);
app.use('/api/otp', otpRoutes);// các route: /request-otp, /reset-password...



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

// Đăng ký user
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

// Đăng nhập user
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

// Giao diện tĩnh
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Chạy server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
