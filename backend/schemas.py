from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# ====================== USER SCHEMAS ======================

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
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UserPublicProfile(BaseModel):
    id: int
    username: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    followers_count: int
    following_count: int
    ratings_count: int
    
    class Config:
        from_attributes = True

class UserUpdateProfile(BaseModel):
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ====================== EXISTING SCHEMAS ======================

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
    content_type: str
    content_id: str
    title: str
    poster_url: Optional[str]
    rating: float
    review: Optional[str]
    rated_at: datetime

    class Config:
        from_attributes = True

# ====================== NEW: SOCIAL SCHEMAS ======================

class FollowResponse(BaseModel):
    id: int
    follower_id: int
    following_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class FollowerDetail(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    followed_at: datetime

    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    id: int
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    activity_type: str
    content_type: Optional[str] = None
    content_id: Optional[str] = None
    content_title: Optional[str] = None
    content_poster: Optional[str] = None
    rating_value: Optional[float] = None
    target_user_id: Optional[int] = None
    target_username: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
