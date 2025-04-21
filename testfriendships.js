const axios = require('axios');

// ⚡ URL API server của bạn
const BASE_URL = 'http://localhost:8000/api/friends';

// ⚡ ID mẫu — thay bằng ID user thật của bạn
const requesterId = '67f16df4f4fd25c41910d30c';
const recipientId = '67ffd8900dfca4d94ea8fe3e';

async function testFriendshipAPI() {
    try {
        console.log('🔹 Gửi lời mời kết bạn...');
        let res = await axios.post(`${BASE_URL}/request`, {
            requesterId,
            recipientId
        });
        console.log('✅ Kết quả Request:', res.data);

        console.log('🔹 Chấp nhận lời mời...');
        res = await axios.post(`${BASE_URL}/accept`, {
            requesterId,
            recipientId
        });
        console.log('✅ Kết quả Accept:', res.data);

        console.log('🔹 Lấy danh sách bạn bè...');
        res = await axios.get(`${BASE_URL}/friends/${requesterId}`);
        console.log('✅ Danh sách bạn bè:', res.data);

        // Nếu muốn test từ chối lời mời:
        // console.log('🔹 Từ chối lời mời...');
        // res = await axios.post(`${BASE_URL}/decline`, {
        //     requesterId,
        //     recipientId
        // });
        // console.log('✅ Kết quả Decline:', res.data);

    } catch (err) {
        if (err.response) {
            console.error('❌ Lỗi API:', err.response.data);
        } else {
            console.error('❌ Lỗi khác:', err.message);
        }
    }
}

testFriendshipAPI();
