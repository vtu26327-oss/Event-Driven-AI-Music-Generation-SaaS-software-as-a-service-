const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, MemoryDB } = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretaimusic2026';

let useMemory = false;
router.use((req, res, next) => {
  // Check if Mongoose is connected
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    useMemory = true;
  }
  next();
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (useMemory) {
      if (MemoryDB.find(u => u.email === email || u.username === username)) {
        return res.status(400).json({ error: 'User already exists in session DB' });
      }
      const newUser = { _id: Date.now().toString(), username, email, password: hashedPassword };
      MemoryDB.push(newUser);
      
      const token = jwt.sign({ id: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({ token, user: { id: newUser._id, username, email } });
    } else {
      let existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'User already exists' });

      existingUser = new User({ username, email, password: hashedPassword });
      await existingUser.save();

      const token = jwt.sign({ id: existingUser._id, username: existingUser.username }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token, user: { id: existingUser._id, username, email } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let user = null;

    if (useMemory) {
      user = MemoryDB.find(u => u.email === email);
    } else {
      user = await User.findOne({ email });
    }

    if (!user) return res.status(400).json({ error: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid Credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;
