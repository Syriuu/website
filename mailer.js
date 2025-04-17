const nodemailer = require('nodemailer');

const useTLS = process.env.EMAIL_USE_TLS === 'true';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: !useTLS, // false nếu dùng TLS với port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

const sendMail = async (to, subject, text) => {
  await transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

module.exports = { sendMail };
