from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Text
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

# ====================== MODELS ======================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    bio = Column(Text, nullable=True)  # NEW: User bio
    avatar_url = Column(String, nullable=True)  # NEW: Profile picture
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    favorites = relationship("Favorite", back_populates="user")
    history = relationship("History", back_populates="user")
    ratings = relationship("Rating", back_populates="user")
    
    # Follow relationships
    followers = relationship(
        "Follow",
        foreign_keys="Follow.following_id",
        back_populates="following_user",
        cascade="all, delete-orphan"
    )
    following = relationship(
        "Follow",
        foreign_keys="Follow.follower_id",
        back_populates="follower_user",
        cascade="all, delete-orphan"
    )
    
    # Activity feed
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_type = Column(String)  # 'movies', 'tv', 'anime'
    content_id = Column(String)
    title = Column(String)
    poster_url = Column(String, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="favorites")


class History(Base):
    __tablename__ = "history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_type = Column(String)
    content_id = Column(String)
    title = Column(String)
    poster_url = Column(String, nullable=True)
    viewed_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="history")


class Rating(Base):
    __tablename__ = "ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_type = Column(String)
    content_id = Column(String)
    title = Column(String)
    poster_url = Column(String, nullable=True)
    rating = Column(Float)  # 1-10 scale
    review = Column(Text, nullable=True)
    rated_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="ratings")


# ====================== NEW: SOCIAL FEATURES ======================

class Follow(Base):
    """User follow relationships"""
    __tablename__ = "follows"
    
    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # User who follows
    following_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # User being followed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    follower_user = relationship("User", foreign_keys=[follower_id], back_populates="following")
    following_user = relationship("User", foreign_keys=[following_id], back_populates="followers")


class Activity(Base):
    """User activity feed (ratings, favorites, etc.)"""
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_type = Column(String, nullable=False)  # 'rating', 'favorite', 'follow'
    content_type = Column(String, nullable=True)  # 'movies', 'tv', 'anime'
    content_id = Column(String, nullable=True)
    content_title = Column(String, nullable=True)
    content_poster = Column(String, nullable=True)
    rating_value = Column(Float, nullable=True)  # For rating activities
    target_user_id = Column(Integer, nullable=True)  # For follow activities
    target_username = Column(String, nullable=True)  # For follow activities
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="activities")


# ====================== DATABASE FUNCTIONS ======================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
