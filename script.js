// Simple local storage for users
const users = JSON.parse(localStorage.getItem('users')) || {};

// Function to hash the password
function hashPassword(password) {
    return btoa(password); // Simple base64 encoding (not recommended for real-world use)
}

// Function to handle login
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    const hashedPassword = hashPassword(password);

    // Check if username exists and password matches
    if (users[username] && users[username] === hashedPassword) {
        // Successful login, redirect to the main page
        window.location.href = 'main.html';
    } else {
        errorMessage.textContent = 'Invalid username or password';
    }
});

// Function to save new users (for demo purposes)
function saveUser(username, password) {
    users[username] = hashPassword(password);
    localStorage.setItem('users', JSON.stringify(users));
}

// Example user creation (you can remove this in real implementation)
saveUser('exampleUser', 'examplePass');