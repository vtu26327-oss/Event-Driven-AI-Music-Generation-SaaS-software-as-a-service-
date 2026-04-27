import os
import time
import random
import jwt
import bcrypt
from datetime import datetime, timedelta
import urllib.request
import urllib.parse
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Import LSTM model for AI-powered recommendations
try:
    from lstm_model import MusicLSTMModel, initialize_lstm
    LSTM_AVAILABLE = True
except ImportError:
    LSTM_AVAILABLE = False
    print("LSTM model not available, using fallback")

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app)

app.config['SECRET_KEY'] = 'supersecretaimusic2026'

# Initialize LSTM model for AI-powered music recommendations
lstm_recommender = None
if LSTM_AVAILABLE:
    print("Initializing LSTM model for music recommendations...")
    lstm_recommender = initialize_lstm()
    print("LSTM model ready!")

# In-memory DB for demo
MemoryDB = []

DUMMY_DATA = [
    { 'id': 1, 'title': 'Classical Serene', 'genre': 'Classical', 'mood': 'Calm', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { 'id': 2, 'title': 'Upbeat Pop Energy', 'genre': 'Pop', 'mood': 'Energetic', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { 'id': 3, 'title': 'Jazz Cafe Evening', 'genre': 'Jazz', 'mood': 'Calm', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { 'id': 4, 'title': 'Intense Workout EDM', 'genre': 'EDM', 'mood': 'Energetic', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { 'id': 5, 'title': 'Sad Symphony', 'genre': 'Classical', 'mood': 'Sad', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
    { 'id': 6, 'title': 'Happy Pop Vibes', 'genre': 'Pop', 'mood': 'Happy', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
    { 'id': 7, 'title': 'Midnight Jazz Blues', 'genre': 'Jazz', 'mood': 'Sad', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
    { 'id': 8, 'title': 'Chill EDM Relax', 'genre': 'EDM', 'mood': 'Calm', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { 'id': 9, 'title': 'AI Generated Synth', 'genre': 'Any', 'mood': 'Any', 'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3' }
]

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if any(u['email'] == email or u['username'] == username for u in MemoryDB):
        return jsonify({'error': 'User already exists'}), 400

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    new_user = {
        '_id': str(int(time.time())),
        'username': username,
        'email': email,
        'password': hashed_password
    }
    MemoryDB.append(new_user)
    
    token = jwt.encode({
        'id': new_user['_id'],
        'username': new_user['username'],
        'exp': datetime.utcnow() + timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({'token': token, 'user': {'id': new_user['_id'], 'username': username, 'email': email}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    user = next((u for u in MemoryDB if u['email'] == email), None)
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return jsonify({'error': 'Invalid Credentials'}), 400

    token = jwt.encode({
        'id': user['_id'],
        'username': user['username'],
        'exp': datetime.utcnow() + timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({'token': token, 'user': {'id': user['_id'], 'username': user['username'], 'email': user['email']}})

@app.route('/api/music/generate', methods=['POST'])
def generate_music():
    data = request.json
    mood = data.get('mood', 'Happy')
    genre = data.get('genre', 'Pop')
    activity = data.get('activity', 'Workout')
    language = data.get('language', '')
    
    print(f"Generating vocal music for - Language: {language}, Mood: {mood}, Genre: {genre}, Activity: {activity}")
    
    # Load regional DB
    regional_db = {}
    try:
        with open('regional_db.json', 'r', encoding='utf-8') as f:
            regional_db = json.load(f)
    except Exception as e:
        print(f"Error loading regional_db.json: {e}")

    # Map frontend moods to regional DB moods
    db_mood = mood
    if mood == 'Calm' or mood == 'Relax': db_mood = 'Relax'
    elif mood == 'Energetic' or mood == 'Workout': db_mood = 'Workout'
    
    valid_tracks = []
    
    # 1. Try to get from Regional DB (Guaranteed language and mood)
    if language in regional_db:
        if db_mood in regional_db[language]:
            valid_tracks = regional_db[language][db_mood]
            print(f"Found {len(valid_tracks)} tracks in Regional DB for {language} - {db_mood}")

    # 2. If not found in Regional DB, fallback to iTunes Search with strict filters
    if not valid_tracks:
        # STRICT LANGUAGE ISOLATION MAP
        STRICT_LANG_MAP = {
            "Telugu": {"artists": ["Karthik", "Anirudh", "DSP"], "industry": "Tollywood Telugu", "country": "IN"},
            "Hindi": {"artists": ["Arijit Singh", "Pritam"], "industry": "Bollywood Hindi", "country": "IN"},
            "Tamil": {"artists": ["Anirudh", "A.R. Rahman"], "industry": "Kollywood Tamil", "country": "IN"},
            "English": {"artists": ["Ed Sheeran", "Taylor Swift"], "industry": "Pop English", "country": "US"}
        }

        country_code = "US"
        search_keywords = f"{mood} {genre} {activity}"
        
        if language in STRICT_LANG_MAP:
            lang_data = STRICT_LANG_MAP[language]
            country_code = lang_data["country"]
            artist = random.choice(lang_data["artists"])
            search_keywords = f"{artist} {lang_data['industry']} {mood}"
        
        try:
            encoded_term = urllib.parse.quote_plus(search_keywords)
            itunes_url = f"https://itunes.apple.com/search?term={encoded_term}&country={country_code}&entity=song&limit=20"
            req = urllib.request.Request(itunes_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode())
                valid_tracks = [t for t in result.get('results', []) if t.get('previewUrl')]
                
                # Title formatting for iTunes results
                for track in valid_tracks:
                    track['title'] = f"{track.get('trackName')} - {track.get('artistName')} ({language if language else 'AI'})"
                    track['url'] = track.get('previewUrl')
        except Exception as e:
            print("API search error:", e)

    # 3. Final selection and response
    if valid_tracks:
        selected_track = random.choice(valid_tracks)
        generated_track = {
            'title': selected_track.get('title', selected_track.get('trackName', 'AI Track')),
            'url': selected_track.get('url', selected_track.get('previewUrl')),
            'duration': 'Media Preview',
            'timestamp': datetime.utcnow().isoformat(),
            'language': language or 'Universal'
        }
    else:
        # Ultimate Fallback
        fallback = random.choice(DUMMY_DATA)
        generated_track = {
            'title': f"{language if language else 'AI'} {mood} {genre} Track",
            'url': fallback['url'],
            'duration': 'Preview',
            'timestamp': datetime.utcnow().isoformat(),
            'language': language or 'Universal'
        }
        
    return jsonify({'success': True, 'track': generated_track})

if __name__ == '__main__':
    print("Starting Flask Server on port 5000...")
    app.run(port=5000, debug=True)
