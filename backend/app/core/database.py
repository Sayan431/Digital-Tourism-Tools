
import logging

from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("uvicorn")


def get_engine_and_base():
    db_url = settings.DATABASE_URL

    if not db_url:
        raise RuntimeError("DATABASE_URL is not configured.")

    # Explicit SQLite configuration for local development only
    if db_url.startswith("sqlite"):
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
        base = declarative_base()
        return engine, base

    # Normalize PostgreSQL URL to use psycopg2
    if db_url.startswith("postgres://"):
        db_url = db_url.replace(
            "postgres://",
            "postgresql+psycopg2://",
            1
        )
    elif db_url.startswith("postgresql+psycopg://"):
        db_url = db_url.replace(
            "postgresql+psycopg://",
            "postgresql+psycopg2://",
            1
        )
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace(
            "postgresql://",
            "postgresql+psycopg2://",
            1
        )

    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
    )

    try:
        with engine.connect() as conn:
            conn.execute(
                text(f'CREATE SCHEMA IF NOT EXISTS "{settings.DB_SCHEMA}"')
            )
            conn.commit()

        metadata = MetaData(schema=settings.DB_SCHEMA)
        base = declarative_base(metadata=metadata)

        logger.info("Successfully connected to PostgreSQL.")

        return engine, base

    except Exception:
        engine.dispose()
        logger.exception(
            "PostgreSQL connection failed. No SQLite fallback will be used."
        )
        raise


engine, Base = get_engine_and_base()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
