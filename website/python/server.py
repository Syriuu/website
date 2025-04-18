from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='html')
CORS(app)

# In-memory dummy user (replace with MongoDB logic later)
users = {
    "test": {"password": "1234", "email": "test@email.com"}
}

@app.route('/')
def serve_home():
    return send_from_directory('html', 'login.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('html', path)

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    user = users.get(username)

    if user and user['password'] == password:
        return jsonify({"status": "success", "message": "Login successful"})
    else:
        return jsonify({"status": "fail", "message": "Invalid credentials"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    if username in users:
        return jsonify({"message": "Username already exists"}), 400

    users[username] = {
        "password": data['password'],
        "email": data['email']
    }
    return jsonify({"message": "User registered successfully"})

@app.route('/get_user', methods=['POST'])
def get_user():
    data = request.json
    username = data['username']
    user = users.get(username)
    if user:
        return jsonify({"status": "success", "user": {"username": username}})
    else:
        return jsonify({"status": "fail", "message": "User not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)
