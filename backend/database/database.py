from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import get_settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()

# CHECKPOINT: Database Engine Creation with Auto-Fallback
# 1. We attempt to connect to PostgreSQL as configured in .env.
# 2. If PostgreSQL credentials fail or the server is offline, we fall back to SQLite for local development.
db_url = settings.database_url
is_sqlite = False

try:
    if db_url.startswith("postgresql"):
        # Test connection
        test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
        with test_engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database.")
        engine = test_engine
    else:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
        is_sqlite = True
except Exception as e:
    logger.warning(f"PostgreSQL connection failed ({e}). Falling back to local SQLite database.")
    db_url = "sqlite:///./aihealthverse.db"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    is_sqlite = True

# CHECKPOINT: Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# CHECKPOINT: Base Model
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

