const express = require('express');
const router = express.Router();
const User = require('../models/User'); // <-- Đã sửa
const Friendship = require('../models/Friendship'); // <-- Đã sửa

// API lấy danh sách bạn bè
router.get('/friends', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    // Tìm tất cả friendship đã accepted
    const friendships = await Friendship.find({
      status: 'accepted',
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    });

    // Lấy danh sách friendId (là người còn lại, không phải mình)
    const friendIds = friendships.map(f => 
      f.requester.toString() === userId ? f.recipient : f.requester
    );

    // Lấy thông tin bạn bè từ users
    const friends = await User.find(
      { _id: { $in: friendIds } },
      'username avatar' // chỉ lấy username và avatar
    );

    res.json(friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
