import urllib.request
import urllib.error

url = 'https://odyssey-iua-2026-1.onrender.com/api/sessions/claim'
try:
    req = urllib.request.Request(url, data=b'{"device_id": "test"}', headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as res:
        print(res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f'HTTP Error: {e.code}')
    print(e.read().decode('utf-8'))
