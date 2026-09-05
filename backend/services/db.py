import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from config import Config

logger = logging.getLogger(__name__)

Base = declarative_base()

engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
    "pool_recycle": 300
}

if "postgresql" in Config.SQLALCHEMY_DATABASE_URI:
    engine_kwargs["connect_args"] = {"connect_timeout": 10}

engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    **engine_kwargs
)

db_session = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

def init_db():
    """Initializes the database schema and creates tables if they do not exist."""
    import models.transaction
    
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized.")
    except Exception as e:
        logger.warning(f"Notice during init_db: {e}")
