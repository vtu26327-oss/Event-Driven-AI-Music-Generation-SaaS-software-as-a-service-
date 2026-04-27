import urllib.request
import json

langs = ['Telugu', 'Tamil', 'Hindi']
moods = ['Happy', 'Sad', 'Romantic', 'Workout', 'Relax']
results = {}

for l in langs:
    results[l] = {}
    for m in moods:
        try:
            req = urllib.request.Request(f'https://itunes.apple.com/search?term={l}+{m}&country=IN&entity=song&limit=15')
            req.add_header('User-Agent', 'Mozilla/5.0')
            d = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
            results[l][m] = [{'title': f"{t.get('trackName')} - {t.get('artistName')} ({l} {m})", 'url': t.get('previewUrl')} for t in d.get('results',[]) if t.get('previewUrl')][:3]
            print(f"Fetched {l} {m}: {len(results[l][m])} tracks")
        except Exception as e:
            print(f"Failed {l} {m}: {e}")

with open('regional_db.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2)
