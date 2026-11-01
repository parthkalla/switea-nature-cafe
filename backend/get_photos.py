import urllib.request
import re
import json

url = 'https://www.google.com/maps/place/RoastFuze+Coffee+Bar+-+Musical+Balcony+cafe/@26.9056268,75.7271802,17z/data=!4m7!3m6!1s0x396db5fadc6985e1:0xec2fb39c9113ff9e!8m2!3d26.9056268!4d75.7271802!10e5!16s%2Fg%2F11xhbpgh0x'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
    
    # Extract lh3 and lh5 googleusercontent URLs
    matches = set(re.findall(r'https://lh[35]\.googleusercontent\.com/[a-zA-Z0-9_\-\/]+', html))
    results = [m for m in matches if not m.endswith('/a-') and len(m) > 40]
    print(f"Found {len(results)} image URLs:")
    for i, r in enumerate(results[:20]):
        print(f"{i+1}: {r}")
        
    with open('maps_photos.json', 'w') as f:
        json.dump(results, f, indent=2)
except Exception as e:
    print(f"Error: {e}")
