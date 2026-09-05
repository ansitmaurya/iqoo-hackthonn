import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from config import Config

logger = logging.getLogger(__name__)

Base = declarative_base()

engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    echo=False,
    pool_pre_ping=True
)

db_session = scoped_session(
    sessionmaker(autocommit=False, autoflush=False, bind=engine)
)

def init_db():
    """Initializes the database schema and creates tables if they do not exist."""
    import models.user
    import models.network_node
    import models.network_edge
    import models.transaction
    import models.alert
    
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized with URI: %s", Config.SQLALCHEMY_DATABASE_URI.split("@")[-1])
