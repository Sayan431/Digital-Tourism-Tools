
import logging

from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

logger = logging.getLogger("uvicorn")


def get_engine_and_base():
    db_url = settings.DATABASE_URL

    if not db_url:
        raise RuntimeError("DATABASE_URL is not configured.")

    # Allow SQLite only when explicitly configured for local development.
    if db_url.startswith("sqlite"):
        engine = create_engine(
            db_url,
            connect_args={"check_same_thread": False}
        )
        base = declarative_base()
        return engine, base

    # PostgreSQL connection (Neon in production)
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
