
from jose import jwt
import base64

secret = 'w///8Ahp/zN21YvvttwZ/lPjGOor7RxLD9MQ0cZuGQWJIskc9pn9EMF1+a9bxbsT3ZvVTXHYq/fmNk+YPG6x4Q=='
payload = {'sub': '123', 'aud': 'authenticated'}

# Sign with string
token1 = jwt.encode(payload, secret, algorithm='HS256')
print('Token 1:', token1)

# Sign with base64 decoded bytes? (Supabase secrets are NOT base64 decoded by default unless specified?)
# Wait, actually, let's see if we can just test the validation
try:
    decoded = jwt.decode(token1, secret, algorithms=['HS256'], audience='authenticated')
    print('Decoded string secret:', decoded)
except Exception as e:
    print('Error string:', e)

