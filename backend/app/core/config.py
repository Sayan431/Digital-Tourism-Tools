import os
from typing import List
from pathlib import Path

# Load from .env if present
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                os.environ.setdefault(key.strip(), val.strip())

class Settings:
    PROJECT_NAME: str = "Digital Tourism Management Platform"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg2://neondb_owner:npg_8AjChB0rpmTX@ep-tiny-brook-ahledph2-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )
    DB_SCHEMA: str = os.getenv("DB_SCHEMA", "digital_tourism")
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "digital-tourism-management-secret-key-super-secure-2026-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

settings = Settings()

