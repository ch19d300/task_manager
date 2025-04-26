# database.py
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use Heroku's DATABASE_URL environment variable or local SQLite database
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./task_management.db")

# Heroku uses postgresql:// but SQLAlchemy 1.4+ requires postgresql+psycopg2://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()