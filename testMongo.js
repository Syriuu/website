require("dotenv").config(); // Đọc biến môi trường từ .env
const mongoose = require("mongoose");

const uri = process.env.MONGO_URI; // Lấy URI từ file .env

async function testConnection() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout nếu không kết nối được
    });

    console.log("✅ Kết nối MongoDB Atlas thành công!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Kết nối thất bại:", error.message);
  }
}

testConnection();

