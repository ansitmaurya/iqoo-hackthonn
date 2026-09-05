import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "traceguard-default-dev-secret-key-999")
    
    # Database URL
    raw_db_url = os.getenv("DATABASE_URL", "").strip()
    
    # Convert postgres:// or postgresql:// to postgresql+psycopg:// for modern driver compatibility
    if raw_db_url.startswith("postgres://"):
        raw_db_url = raw_db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+"):
        raw_db_url = raw_db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        
    sqlite_fallback = os.getenv("SQLITE_FALLBACK", "true").lower() in ("true", "1", "yes")
    
    if raw_db_url and "your_password" not in raw_db_url and "your_project_ref" not in raw_db_url:
        SQLALCHEMY_DATABASE_URI = raw_db_url
    elif sqlite_fallback:
        base_dir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(base_dir, 'traceguard_local.db')}"
    else:
        SQLALCHEMY_DATABASE_URI = raw_db_url or "sqlite:///traceguard_local.db"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # CORS Origins (Allow all by default or specific comma-separated list)
    cors_env = os.getenv("CORS_ORIGINS", "*")
    if cors_env.strip() == "*":
        CORS_ORIGINS = "*"
    else:
        CORS_ORIGINS = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    
    PORT = int(os.getenv("PORT", 5000))
