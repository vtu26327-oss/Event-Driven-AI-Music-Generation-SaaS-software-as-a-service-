const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load regional database
let REGIONAL_DATA = {};
try {
  const dbPath = path.join(__dirname, '..', 'regional_db.json');
  REGIONAL_DATA = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (err) {
  console.error('Error loading regional_db.json:', err);
}

// Mock dataset mapping for genres/moods to royalty-free/public domain mp3 links
const DUMMY_DATA = [
  { id: 1, title: 'Classical Serene', genre: 'Classical', mood: 'Calm', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'Upbeat Pop Energy', genre: 'Pop', mood: 'Energetic', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'Jazz Cafe Evening', genre: 'Jazz', mood: 'Calm', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 4, title: 'Intense Workout EDM', genre: 'EDM', mood: 'Energetic', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 5, title: 'Sad Symphony', genre: 'Classical', mood: 'Sad', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 6, title: 'Happy Pop Vibes', genre: 'Pop', mood: 'Happy', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 7, title: 'Midnight Jazz Blues', genre: 'Jazz', mood: 'Sad', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { id: 8, 'title': 'Chill EDM Relax', genre: 'EDM', mood: 'Calm', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
  { id: 9, title: 'AI Generated Synth', genre: 'Any', mood: 'Any', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' }
];

// POST route to generate/fetch music
router.post('/generate', (req, res) => {
  const { mood, genre, activity, language } = req.body;

  console.log(`Generating music for - Language: ${language}, Mood: ${mood}, Genre: ${genre}, Activity: ${activity}`);

  setTimeout(() => {
    let pool = [];

    // If a specific language is selected and exists in our regional DB
    if (language && REGIONAL_DATA[language]) {
      // Map frontend moods to regional DB moods if necessary
      let dbMood = mood;
      if (mood === 'Calm') dbMood = 'Relax';
      if (mood === 'Energetic') dbMood = 'Workout';

      // Strict mood filtering from regional DB
      if (REGIONAL_DATA[language][dbMood]) {
        pool = REGIONAL_DATA[language][dbMood];
      }
    }

    // Fallback to DUMMY_DATA if no language matches or pool is empty
    if (pool.length === 0) {
      pool = DUMMY_DATA.filter(item => item.mood === mood);
      
      // If still empty, try matching genre or any
      if (pool.length === 0) {
        pool = DUMMY_DATA.filter(item => item.genre === genre || item.mood === mood);
      }
      if (pool.length === 0) {
        pool = [DUMMY_DATA[DUMMY_DATA.length - 1]];
      }
    }

    // Pick a random track from matched pool
    const selectedTrack = pool[Math.floor(Math.random() * pool.length)];
    
    const generatedTrack = {
      title: selectedTrack.title || `AI ${genre} (${activity}) - ${mood}`,
      url: selectedTrack.url,
      duration: '0:30 (Preview)',
      timestamp: new Date(),
      language: language || 'Universal'
    };

    res.json({ success: true, track: generatedTrack });
  }, 1500); 
});

module.exports = router;

