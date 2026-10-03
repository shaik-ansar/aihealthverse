from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # CHECKPOINT: Loading Environment Variables
    # The application configuration is loaded here, ensuring that sensitive details like database URLs and API keys are not hardcoded.
    database_url: str = "postgresql://postgres:password@localhost:5432/aihealthverse"
    google_api_key: str = ""
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    jwt_secret: str = "healthverse-super-secret-jwt-key-change-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days
    external_ocr_api_key: str = ""         # Reserved slot for Cloud OCR API (Google Cloud Vision / Azure)
    app_name: str = "AI HealthVerse Backend"
    debug: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache()
def get_settings():
    # CHECKPOINT: Settings Cache
    # We cache the settings so that we don't read the .env file repeatedly on every request.
    return Settings()
