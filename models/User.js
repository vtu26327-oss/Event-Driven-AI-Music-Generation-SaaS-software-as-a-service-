const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Since MongoDB might not be running locally, let's export a mock interface too
module.exports = {
  User: mongoose.models.User || mongoose.model('User', UserSchema),
  // In-memory array fallback if db is failing
  MemoryDB: []
};
