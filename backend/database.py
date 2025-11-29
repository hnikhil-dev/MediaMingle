from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL")

# Fix for Render's postgres URL format
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    favorites = relationship("Favorite", back_populates="user")
    history = relationship("History", back_populates="user")

# Favorite Model
class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_type = Column(String)  # movies, tv, anime
    content_id = Column(String)
    title = Column(String)
    poster_url = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="favorites")

# NEW: History Model
class History(Base):
    __tablename__ = "history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_type = Column(String)  # movies, tv, anime
    content_id = Column(String)
    title = Column(String)
    poster_url = Column(String, nullable=True)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="history")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
