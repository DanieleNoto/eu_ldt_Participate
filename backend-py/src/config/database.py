from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

from config.config import DB_HOST, DB_NAME, DB_PORT, DB_USER, DB_PASSWORD

Base = declarative_base()

engine = create_engine(
    f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
SessionLocal = sessionmaker(bind=engine)


def init_db():
    with engine.connect() as connection:
        connection.execute(text("CREATE SCHEMA IF NOT EXISTS data_platform"))
        connection.commit()
    Base.metadata.create_all(engine)
