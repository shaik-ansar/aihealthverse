from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from database.database import engine, Base
from routers import consultation, reports, auth, appointments, records
from database.database import SessionLocal
from database.seed_data import seed_hospitals_and_doctors

settings = get_settings()

# CHECKPOINT: Application Startup & Database Initialization
# Here we ensure that all our database tables are created in PostgreSQL before the app starts accepting requests.
Base.metadata.create_all(bind=engine)

# Seed the 5 super-speciality hospitals and specialist doctors
try:
    with SessionLocal() as db_session:
        seed_hospitals_and_doctors(db_session)
except Exception as e:
    print(f"[WARNING] Database seeding skipped or encountered error: {e}")

app = FastAPI(
    title=settings.app_name,
    description="The intelligent backend powering AI HealthVerse, integrating DeepSeek-R1, Gemini OCR, and PostgreSQL.",
    version="1.0.0"
)

# CHECKPOINT: CORS Configuration
# We configure Cross-Origin Resource Sharing so our React frontend (running on port 5173) can talk to this FastAPI backend (port 8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CHECKPOINT: Router Integration
# We mount our specific domain routers into the main application.
app.include_router(auth.router)
app.include_router(consultation.router)
app.include_router(reports.router)
app.include_router(appointments.router)
app.include_router(records.router)

@app.get("/")
def read_root():
    # CHECKPOINT: Root Endpoint
    return {"status": "ok", "message": f"Welcome to {settings.app_name} API"}

@app.get("/health")
def health_check():
    # CHECKPOINT: Health Check — used by the frontend to confirm backend is online
    return {"status": "healthy", "service": "AI HealthVerse Backend", "model": "gemini-3.6-flash"}
