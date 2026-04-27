// Toast Notification Helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  if(!toast) return;
  toast.innerText = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// Redirect helpers
function redirectTo(path) {
  window.location.href = path;
}

// Global API Helper
const API_URL = (window.location.protocol.startsWith('http') && window.location.origin)
  ? `${window.location.origin}/api`
  : '/api';

// ===========
// AUTH LOGIC
// ===========
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Login successful!');
        setTimeout(() => redirectTo('dashboard.html'), 1000);
      } else {
        showToast(data.error || 'Login failed');
      }
    } catch(err) {
      console.error('Login request failed:', err);
      showToast('Network error. Make sure the server is running and you opened the page from http://localhost:5000');
    }
  });
}

const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-user').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        showToast('Account created!');
        setTimeout(() => redirectTo('dashboard.html'), 1000);
      } else {
        showToast(data.error || 'Registration failed');
      }
    } catch(err) {
      console.error('Register request failed:', err);
      showToast('Network error. Make sure the server is running and you opened the page from http://localhost:5000');
    }
  });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    redirectTo('login.html');
  });
}


// ===============
// DASHBOARD LOGIC
// ===============
const genForm = document.getElementById('generate-form');
const loading = document.getElementById('loading');
const audioPlayer = document.getElementById('audio-player');
const playPauseBtn = document.getElementById('play-pause-btn');
const stopBtn = document.getElementById('stop-btn');
const downloadBtn = document.getElementById('download-btn');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.getElementById('progress-bar');
const turntable = document.getElementById('turntable');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');
const volumeSlider = document.getElementById('volume-slider');
const historyList = document.getElementById('history-list');

let isPlaying = false;
let currentTrackList = [];

if (genForm) {
  genForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mood = document.getElementById('mood').value;
    const genre = document.getElementById('genre').value;
    const activity = document.getElementById('activity').value;
    const language = document.getElementById('language').value;

    // Show loading overlay
    loading.style.display = 'flex';

    try {
      const res = await fetch(`${API_URL}/music/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ mood, genre, activity, language })
      });

      const data = await res.json();
      loading.style.display = 'none';

      if (res.ok) {
        loadTrack(data.track);
        addToHistory(data.track);
        showToast('Music Generated!');
      } else {
        showToast(data.error || 'Failed to generate');
      }
    } catch(err) {
       loading.style.display = 'none';
       console.error('Music generation request failed:', err);
       showToast('Network error during generation. Ensure the API server is running.');
     }
   });
 }

 // Persist Settings
 if (genForm) {
   const moodSelect = document.getElementById('mood');
   const languageSelect = document.getElementById('language');
   const genreSelect = document.getElementById('genre');
   const activitySelect = document.getElementById('activity');

   // Save on change
   [moodSelect, languageSelect, genreSelect, activitySelect].forEach(select => {
     select.addEventListener('change', () => {
       localStorage.setItem(`pref_${select.id}`, select.value);
     });
   });

   // Restore on load
   window.addEventListener('load', () => {
     [moodSelect, languageSelect, genreSelect, activitySelect].forEach(select => {
       const saved = localStorage.getItem(`pref_${select.id}`);
       if (saved !== null) {
         select.value = saved;
       }
     });
   });
 }

function loadTrack(track) {
  document.getElementById('now-playing-title').innerText = track.title;
  
  // Format the mood/genre nicely
  document.getElementById('now-playing-meta').innerText = `Generated | Playing now`;

  audioPlayer.src = track.url;
  audioPlayer.load();
  playTrack();
}

function playTrack() {
  audioPlayer.play();
  isPlaying = true;
  playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  turntable.classList.add('playing');
  toggleVisualizer(true);
}

function pauseTrack() {
  audioPlayer.pause();
  isPlaying = false;
  playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  turntable.classList.remove('playing');
  toggleVisualizer(false);
}

function toggleVisualizer(state) {
  const bars = document.querySelectorAll('.bar');
  bars.forEach(bar => {
    if(state) bar.classList.add('active');
    else bar.classList.remove('active');
  });
}

if (playPauseBtn) {
  playPauseBtn.addEventListener('click', () => {
    if (!audioPlayer.src) {
      showToast('Please generate a track first!');
      return;
    }
    if (isPlaying) pauseTrack();
    else playTrack();
  });
}

if (stopBtn) {
  stopBtn.addEventListener('click', () => {
    if(!audioPlayer.src) return;
    pauseTrack();
    audioPlayer.currentTime = 0;
  });
}

if (audioPlayer) {
  audioPlayer.addEventListener('timeupdate', () => {
    const { currentTime, duration } = audioPlayer;
    if (duration) {
      const progressPercent = (currentTime / duration) * 100;
      progressFill.style.width = `${progressPercent}%`;
      
      const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      };

      currentTimeEl.innerText = formatTime(currentTime);
      durationTimeEl.innerText = formatTime(duration);
    }
  });

  audioPlayer.addEventListener('ended', () => {
    pauseTrack();
    progressFill.style.width = '0%';
    currentTimeEl.innerText = '0:00';
  });
}

if (progressBar) {
  progressBar.addEventListener('click', (e) => {
    if(!audioPlayer.duration) return;
    const width = progressBar.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
  });
}

if (volumeSlider) {
  volumeSlider.addEventListener('input', (e) => {
    if(audioPlayer) {
      audioPlayer.volume = e.target.value;
    }
  });
}

// Download button logic removed per user request
function renderHistory() {
  if (!historyList) return;
  
  if (currentTrackList.length === 0) {
    historyList.innerHTML = `<li class="history-item"><span><i class="fa-solid fa-music"></i> Create your first track</span></li>`;
    return;
  }
  
  historyList.innerHTML = '';
  currentTrackList.forEach(track => {
    // Ensure safety for inline script attributes
    const safeTitle = track.title.replace(/'/g, "\\'");
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div>
        <div style="font-weight:600; font-size: 0.9rem;">${track.title}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">Previously Generated</div>
      </div>
      <div style="display:flex; gap:5px; align-items:center;">
        <button class="btn btn-outline" style="padding: 3px 10px; font-size:0.8rem;" onclick="playFromHistory('${track.url}', '${safeTitle}')">
           <i class="fa-solid fa-play"></i>
        </button>
        <button class="btn btn-outline" style="padding: 3px 10px; font-size:0.8rem; border-color:#ff4d4d; color:#ff4d4d;" onclick="deleteHistoryItem('${track.timestamp}')">
           <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    historyList.appendChild(li);
  });
}

function addToHistory(track) {
  if (!track.timestamp) track.timestamp = Date.now().toString();
  currentTrackList.unshift(track);
  localStorage.setItem('trackHistory', JSON.stringify(currentTrackList));
  renderHistory();
}

// Global scope to attach to inline onClick
window.playFromHistory = function(url, title) {
  loadTrack({ url, title });
};

window.deleteHistoryItem = function(timestamp) {
  currentTrackList = currentTrackList.filter(t => t.timestamp !== timestamp);
  localStorage.setItem('trackHistory', JSON.stringify(currentTrackList));
  renderHistory();
};

// INITIALIZE HISTORY ON LOAD
if (historyList) {
  const savedHistory = localStorage.getItem('trackHistory');
  if (savedHistory) {
    try {
      currentTrackList = JSON.parse(savedHistory);
      renderHistory();
    } catch(e) {
      console.error(e);
    }
  }
}
