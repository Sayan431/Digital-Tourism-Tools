import logging
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("uvicorn")

def get_engine_and_base():
    db_url = settings.DATABASE_URL
    is_sqlite = db_url.startswith("sqlite")
    
    try:
        if is_sqlite:
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
            base = declarative_base()
        else:
            engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
            )
            # Create schema if not exists
            with engine.connect() as conn:
                conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {settings.DB_SCHEMA};"))
                conn.commit()

            metadata = MetaData(schema=settings.DB_SCHEMA)
            base = declarative_base(metadata=metadata)

        return engine, base
    except Exception as e:
        logger.error(f"Failed to connect to primary database ({db_url}): {e}")
        logger.warning("Falling back to local SQLite database (sqlite:///./tourism.db)...")
        fallback_engine = create_engine("sqlite:///./tourism.db", connect_args={"check_same_thread": False})
        return fallback_engine, declarative_base()

engine, Base = get_engine_and_base()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
