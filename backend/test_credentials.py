import sys
from config import get_settings
from sqlalchemy import create_engine
import google.generativeai as genai

settings = get_settings()

print("=" * 60)
print("[*] AI HEALTHVERSE CREDENTIALS VALIDATION TOOL")
print("=" * 60)

# 1. Test PostgreSQL Connection
print(f"\n[1/2] Testing PostgreSQL Database Connection...")
print(f"     Target URL: {settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url}")
db_ok = False
try:
    if settings.database_url.startswith("postgresql"):
        engine = create_engine(settings.database_url, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            print("     [OK] SUCCESS: Connected to PostgreSQL database successfully!")
            db_ok = True
    else:
        print("     [INFO] Using SQLite database fallback (Local).")
        db_ok = True
except Exception as e:
    print(f"     [FAILED] PostgreSQL connection error: {e}")
    print("     Tip: Make sure PostgreSQL service is running and credentials in .env are correct.")

# 2. Test Google Gemini API Key
print(f"\n[2/2] Testing Google Gemini API Key...")
gemini_ok = False
if not settings.google_api_key or settings.google_api_key == "your_gemini_api_key_here":
    print("     [NOTICE] No valid Gemini API key set in .env (still using placeholder 'your_gemini_api_key_here').")
    print("     Tip: Open backend/.env, paste your key as GOOGLE_API_KEY=AIzaSy... and press Save (Ctrl+S).")
else:
    masked_key = settings.google_api_key[:6] + "..." + settings.google_api_key[-4:] if len(settings.google_api_key) > 10 else "***"
    print(f"     Key detected: {masked_key}")
    try:
        clean_key = settings.google_api_key.strip("'\"")
        genai.configure(api_key=clean_key)
        model = genai.GenerativeModel('gemini-3.6-flash')
        response = model.generate_content("Respond with 'AI HealthVerse Connected' in 3 words.")
        print(f"     [OK] SUCCESS: Gemini API responded -> '{response.text.strip()}'")
        gemini_ok = True
    except Exception as e:
        print(f"     [FAILED] Gemini API key validation failed: {e}")

print("\n" + "=" * 60)
if db_ok and gemini_ok:
    print("[SUCCESS] ALL CREDENTIALS VALID & OPERATIONAL!")
else:
    print("[INFO] Please review the items above to complete configuration.")
print("=" * 60)

