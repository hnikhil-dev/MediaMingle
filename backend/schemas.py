from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class FavoriteCreate(BaseModel):
    content_type: str
    content_id: str
    title: str
    poster_url: Optional[str] = None

class FavoriteResponse(BaseModel):
    id: int
    content_type: str
    content_id: str
    title: str
    poster_url: Optional[str]
    added_at: datetime
    
    class Config:
        from_attributes = True

# NEW: History Schemas
class HistoryCreate(BaseModel):
    content_type: str
    content_id: str
    title: str
    poster_url: Optional[str] = None

class HistoryResponse(BaseModel):
    id: int
    content_type: str
    content_id: str
    title: str
    poster_url: Optional[str]
    viewed_at: datetime
    
    class Config:
        from_attributes = True

# Rating Schemas
class RatingCreate(BaseModel):
    content_type: str
    content_id: str
    title: str
    poster_url: Optional[str] = None
    rating: float
    review: Optional[str] = None

class RatingUpdate(BaseModel):
    rating: float
    review: Optional[str] = None

class RatingResponse(BaseModel):
    id: int
    user_id: int
    content_type: str
    content_id: str
    title: str
    poster_url: Optional[str]
    rating: float
    review: Optional[str]
    rated_at: datetime

    class Config:
        from_attributes = True

# Follow Schemas
class FollowCreate(BaseModel):
    following_id: int

class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# User Profile (Public View)
class UserProfile(BaseModel):
    id: int
    username: str
    bio: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime
    is_online: bool
    
    # Stats
    followers_count: int
    following_count: int
    ratings_count: int
    favorites_count: int
    
    class Config:
        from_attributes = True

# Activity Feed Schema
class ActivityResponse(BaseModel):
    id: int
    user_id: int
    username: str
    avatar_url: Optional[str]
    activity_type: str
    content_type: Optional[str]
    content_id: Optional[str]
    content_title: Optional[str]
    content_poster: Optional[str]
    rating_value: Optional[float]
    review_text: Optional[str]
    target_user_id: Optional[int]
    target_username: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
