from sqlmodel import create_engine, SQLModel, Session
from typing import Generator
import os

# Database URL configuration
DATABASE_URL = f"postgresql://{os.getenv('DB_USER', 'gestionuser')}:{os.getenv('DB_PASSWORD', 'gestionpass')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'gestionapp')}"

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    """Create database tables. This is optional since you already have init.sql"""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    with Session(engine) as session:
        yield session
