import time
import google.generativeai as genai
from config import get_settings

settings = get_settings()
key = settings.google_api_key.strip("'\"")

# Test 1: REST transport
print("--- Testing transport='rest' ---")
genai.configure(api_key=key, transport='rest')

models_to_test = ['gemini-3.6-flash', 'gemini-2.5-flash-lite', 'gemini-3.1-flash-lite-preview', 'gemini-3.5-flash']

for name in models_to_test:
    try:
        t0 = time.time()
        m = genai.GenerativeModel(name)
        res = m.generate_content("Hello doctor, I have a headache. Reply in 1 sentence.")
        dt = time.time() - t0
        print(f"[{name}] SUCCESS in {dt:.2f}s -> {res.text.strip()}")
    except Exception as e:
        print(f"[{name}] ERROR: {e}")
