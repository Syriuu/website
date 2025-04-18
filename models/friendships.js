const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('./User'); 
const Friendship = require('./Friendship'); 

// 📤 Gửi lời mời kết bạn
router.post('/request', async (req, res) => {
  const { requesterId, recipientId } = req.body;

  const exists = await Friendship.findOne({
    requester: requesterId,
    recipient: recipientId
  });

  if (exists) return res.status(400).json({ message: 'Đã gửi lời mời kết bạn rồi!' });

  const newFriendship = new Friendship({ requester: requesterId, recipient: recipientId });
  await newFriendship.save();

  res.json({ message: 'Đã gửi lời mời kết bạn!' });
});

// ✅ Chấp nhận lời mời
router.post('/accept', async (req, res) => {
  const { requesterId, recipientId } = req.body;

  const updated = await Friendship.findOneAndUpdate(
    { requester: requesterId, recipient: recipientId },
    { status: 'accepted' },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: 'Không tìm thấy lời mời!' });

  res.json({ message: 'Đã chấp nhận lời mời kết bạn!' });
});

// ❌ Từ chối lời mời
router.post('/decline', async (req, res) => {
  const { requesterId, recipientId } = req.body;

  const declined = await Friendship.findOneAndUpdate(
    { requester: requesterId, recipient: recipientId },
    { status: 'declined' },
    { new: true }
  );

  if (!declined) return res.status(404).json({ message: 'Không tìm thấy lời mời!' });

  res.json({ message: 'Đã từ chối lời mời kết bạn!' });
});

// 👥 Lấy danh sách bạn bè của 1 user
router.get('/friends/:userId', async (req, res) => {
  const userId = req.params.userId;

  const friendships = await Friendship.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  }).populate('requester recipient');

  const friends = friendships.map(f => {
    const friend = f.requester._id.toString() === userId ? f.recipient : f.requester;
    return {
      id: friend._id,
      username: friend.username,
      email: friend.email
    };
  });

  res.json(friends);
});

module.exports = router;
