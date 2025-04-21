const nodemailer = require('nodemailer');
require('dotenv').config(); // ✅ Load biến môi trường từ file .env
const crypto = require('crypto'); // Thêm crypto để giải mã

const useTLS = process.env.EMAIL_USE_TLS === 'true';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: !useTLS, // false nếu dùng TLS (port 587)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// Hàm giải mã email
function decryptEmail(encrypted, key) {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return decipher.update(parts[1], 'hex', 'utf8') + decipher.final('utf8');
}

// Mã hóa hai chiều email
function encryptEmail(email, key, iv) {
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(email, 'utf8', 'hex') + cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Hàm gửi email (cập nhật để giải mã trước khi gửi)
const sendMail = async (to, subject, text) => {
  // Giải mã email trước khi gửi
  const encryptionKey = Buffer.from('your-32-byte-encryption-key-here', 'utf-8'); // Đảm bảo có key chính xác
  const decryptedEmail = decryptEmail(to, encryptionKey); // Giải mã email từ phía client

  console.log("Email đã giải mã:", decryptedEmail); // Bạn có thể ghi lại email đã giải mã

  // Gửi email như bình thường
  await transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to: decryptedEmail,  // Gửi đến email đã giải mã
    subject,
    text,
  });
};

module.exports = { sendMail };

console.log('✅ Mailer loaded thành công');
