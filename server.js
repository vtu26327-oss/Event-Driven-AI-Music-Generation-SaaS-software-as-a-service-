const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const musicRoutes = require('./routes/music');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Fallback memory DB for demo if MongoDB is not provided
if (process.env.MONGO_URI && process.env.MONGO_URI !== 'mongodb://localhost:27017/aimusic') {
  mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB connection error:', err));
} else {
  console.log('Using simulated/memory mode or local fallback. (Provide actual MONGO_URI in .env to connect to real DB)');
  // Attempt local connection just in case
  mongoose.connect('mongodb://127.0.0.1:27017/aimusic')
    .then(() => console.log('Local MongoDB Connected'))
    .catch(err => console.log('Local MongoDB not found. Running in memory/mock mode for demo purposes.'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);

// Fallback to index.html for unknown routes (SPA like behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
