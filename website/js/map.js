// interface.js
// This file contains the JavaScript code for the interface of the web application.
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
        document.getElementById("location").innerHTML = "Cannot locate.";
    }
}

function showPosition(position) {
    let lat = position.coords.latitude;
    let lon = position.coords.longitude;
    let mapFrame = document.getElementById("map");
    mapFrame.src = `https://www.google.com/maps?q=${lat},${lon}&output=embed`;

    fetch('/location', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ latitude: lat, longitude: lon })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(data => console.log(data))
    .catch(error => console.error('There was a problem with the fetch operation:', error));
}

function showError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById("location").innerHTML = "Người dùng từ chối yêu cầu định vị.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById("location").innerHTML = "Vị trí không khả dụng.";
            break;
        case error.TIMEOUT:
            document.getElementById("location").innerHTML = "Yêu cầu định vị đã hết thời gian.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById("location").innerHTML = "Đã xảy ra lỗi không xác định.";
            break;
    }
}
window.addEventListener('load', getLocation);
  
  // --- Render all visible avatars + current user + add friend button
  function getRandomColor() {
    const colors = [
      '#FFB6C1', '#87CEFA', '#FFD700', '#ADFF2F', '#FFA07A',
      '#BA55D3', '#00CED1', '#F08080', '#40E0D0', '#E6E6FA',
      '#98FB98', '#DDA0DD', '#FFC0CB', '#FF69B4', '#B0E0E6'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  function renderAvatars() {
    const bar = document.getElementById('iconBar');
    bar.innerHTML = ''; // Clear any existing content
  
    const visibleFriends = state.friends[state.currentUser] || [];
  
    // Render each friend's avatar
    visibleFriends.forEach(friend => {
      if (state.avatars[friend]) {
        const wrapper = document.createElement('div');
        wrapper.className = 'circle-icon avatar-tooltip';
        wrapper.style.backgroundColor = getRandomColor(); // Random color for the circle
  
        const icon = document.createElement('div');
        icon.textContent = state.avatars[friend];
  
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-text';
        tooltip.textContent = friend;
  
        wrapper.appendChild(icon);
        wrapper.appendChild(tooltip);
        bar.appendChild(wrapper);
      }
    });
  
    // Render the current user's avatar
    if (state.avatars[state.currentUser]) {
      const meWrapper = document.createElement('div');
      meWrapper.className = 'circle-icon avatar-tooltip';
      meWrapper.style.backgroundColor = getRandomColor(); // Random color for the circle
      meWrapper.onclick = toggleIconPicker;
      meWrapper.id = 'userAvatar';
  
      const icon = document.createElement('div');
      icon.textContent = state.avatars[state.currentUser];
  
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip-text';
      tooltip.textContent = `${state.currentUser} (You)`;
  
      meWrapper.appendChild(icon);
      meWrapper.appendChild(tooltip);
      bar.appendChild(meWrapper);
    }
  
    // Add friend button
    const addBtn = document.createElement('div');
    addBtn.className = 'circle-icon add-btn';
    addBtn.textContent = '+';
    addBtn.title = 'Add Friend';
    addBtn.onclick = toggleAddFriend;
    addBtn.style.backgroundColor = getRandomColor(); // Random color for the circle
    bar.appendChild(addBtn);
  }
  
  
  
  
  // --- Show/hide the add friend popup
  function toggleAddFriend() {
    const popup = document.getElementById('friendPopup');
    popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
  }
  
  // --- Add a new friend
  function addFriend(name) {
    if (!name || name === state.currentUser) return;
    if (!state.avatars[name]) state.avatars[name] = "😀";
    if (!state.friends[state.currentUser]) state.friends[state.currentUser] = [];
    if (!state.friends[state.currentUser].includes(name)) {
      state.friends[state.currentUser].push(name);
    }
    renderAvatars();
    document.getElementById('friendPopup').style.display = 'none';
  }
  
  // --- Change current user's avatar
  function changeAvatar(emoji) {
    state.avatars[state.currentUser] = emoji;
    renderAvatars();
  }
  
  function toggleMenu(button) {
    button.classList.toggle("active");
    document.getElementById("iconBar").classList.toggle("show");
    document.getElementById("blurLayer").classList.toggle("show");
  }
  
  function toggleIconPicker() {
    const picker = document.querySelector('.icon-picker');
    picker.classList.toggle('show');
  }
  
  function changeAvatar(icon) {
    // Update the avatar emoji in UI
    document.getElementById("userAvatar").textContent = icon;
    document.getElementById("iconPicker").classList.remove("show");
  
    // Update localStorage
    localStorage.setItem("avatar", icon);
  
    // Update state for current user
    const username = localStorage.getItem("username") || "me";
    state.currentUser = username;
    state.avatars[username] = icon;
  
    // Update the avatars sidebar
    renderAvatars();
  
    // Reflect the icon in the map location text
    const locationText = document.getElementById("location");
    if (locationText && locationText.innerHTML.includes("Latitude")) {
      // Remove previous emoji if any
      locationText.innerHTML = locationText.innerHTML.replace(/^[^\d]+/, "");
      locationText.innerHTML = icon + " " + locationText.innerHTML;
    }
    
  
    // Optional: Send to backend to save avatar for user (you can do this later)
  }
  
  
  
  
  document.querySelector('.menu-icon').addEventListener('click', () => {
    document.querySelector('.vertical-bar').classList.toggle('show');
    document.querySelector('.vertical-blur').classList.toggle('show');
  });

  

  
  
  
  // Init
  renderAvatars();
  