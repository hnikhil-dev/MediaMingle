from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import requests
import os
import time

from database import get_db, init_db, User, Favorite, History, Rating, Follow, Activity
from schemas import (
    UserCreate, UserLogin, UserResponse, Token, 
    FavoriteCreate, FavoriteResponse, 
    HistoryCreate, HistoryResponse,
    RatingCreate, RatingUpdate, RatingResponse,
    UserPublicProfile, UserUpdateProfile, FollowResponse, FollowerDetail, ActivityResponse
)
from auth import get_password_hash, verify_password, create_access_token, get_current_user

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# Initialize database
init_db()

# ====================== AUTH ENDPOINTS ======================

@app.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    """Register new user"""
    existing_user = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email or username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer", "user": db_user}


@app.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user


# ====================== TMDB ENDPOINTS ======================

@app.get("/trending-movies")
def get_trending_movies():
    url = "https://api.themoviedb.org/3/trending/movie/week"
    params = {"api_key": TMDB_API_KEY}
    response = requests.get(url, params=params)
    return response.json()


@app.get("/trending-tv")
def get_trending_tv():
    url = "https://api.themoviedb.org/3/trending/tv/week"
    params = {"api_key": TMDB_API_KEY}
    response = requests.get(url, params=params)
    return response.json()


@app.get("/search-movies")
def search_movies(query: str):
    url = "https://api.themoviedb.org/3/search/movie"
    params = {"api_key": TMDB_API_KEY, "query": query}
    response = requests.get(url, params=params)
    return response.json()


@app.get("/search-tv")
def search_tv(query: str):
    url = "https://api.themoviedb.org/3/search/tv"
    params = {"api_key": TMDB_API_KEY, "query": query}
    response = requests.get(url, params=params)
    return response.json()


# ====================== JIKAN ANIME ENDPOINTS ======================

@app.get("/trending-anime")
def get_trending_anime():
    url = "https://api.jikan.moe/v4/top/anime"
    params = {"limit": 20}
    response = requests.get(url, params=params)
    time.sleep(0.5)  # Rate limit
    return response.json()


@app.get("/search-anime")
def search_anime(query: str):
    url = "https://api.jikan.moe/v4/anime"
    params = {"q": query, "limit": 20}
    response = requests.get(url, params=params)
    time.sleep(0.5)  # Rate limit
    return response.json()


# ====================== MOOD RECOMMENDATIONS ======================

@app.get("/recommend")
def get_recommendations(mood: str, content_type: str):
    mood_genre_map = {
        "movies": {
            "happy": 35, "sad": 18, "exciting": 28,
            "scary": 27, "thoughtful": 878, "relaxing": 10749
        },
        "tv": {
            "happy": 35, "sad": 18, "exciting": 10759,
            "scary": 9648, "thoughtful": 10765, "relaxing": 10751
        }
    }
    
    if content_type == "anime":
        mood_genre_map_anime = {
            "happy": 4, "sad": 8, "exciting": 1,
            "scary": 14, "thoughtful": 40, "relaxing": 36
        }
        genre_id = mood_genre_map_anime.get(mood, 1)
        url = "https://api.jikan.moe/v4/anime"
        params = {"genres": genre_id, "order_by": "popularity", "limit": 20}
        response = requests.get(url, params=params)
        time.sleep(0.5)
        return response.json()
    else:
        genre_id = mood_genre_map.get(content_type, {}).get(mood, 28)
        endpoint = "movie" if content_type == "movies" else "tv"
        url = f"https://api.themoviedb.org/3/discover/{endpoint}"
        params = {
            "api_key": TMDB_API_KEY,
            "with_genres": genre_id,
            "sort_by": "popularity.desc"
        }
        response = requests.get(url, params=params)
        return response.json()


# ====================== FAVORITES ENDPOINTS ======================

@app.post("/favorites", response_model=FavoriteResponse)
def add_favorite(
    favorite: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add content to favorites"""
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.content_type == favorite.content_type,
        Favorite.content_id == favorite.content_id
    ).first()
    
    if existing:
        return existing
    
    new_favorite = Favorite(
        user_id=current_user.id,
        content_type=favorite.content_type,
        content_id=favorite.content_id,
        title=favorite.title,
        poster_url=favorite.poster_url
    )
    db.add(new_favorite)
    
    # Create activity
    activity = Activity(
        user_id=current_user.id,
        activity_type="favorite",
        content_type=favorite.content_type,
        content_id=favorite.content_id,
        content_title=favorite.title,
        content_poster=favorite.poster_url
    )
    db.add(activity)
    
    db.commit()
    db.refresh(new_favorite)
    return new_favorite


@app.get("/favorites", response_model=List[FavoriteResponse])
def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's favorites"""
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).order_by(Favorite.added_at.desc()).all()
    return favorites


@app.get("/favorites/check/{content_type}/{content_id}")
def check_favorite(
    content_type: str,
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if content is favorited"""
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.content_type == content_type,
        Favorite.content_id == content_id
    ).first()
    
    return {
        "is_favorite": favorite is not None,
        "favorite_id": favorite.id if favorite else None
    }


@app.delete("/favorites/{favorite_id}")
def delete_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove from favorites"""
    favorite = db.query(Favorite).filter(
        Favorite.id == favorite_id,
        Favorite.user_id == current_user.id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(favorite)
    db.commit()
    return {"message": "Favorite removed"}


# ====================== HISTORY ENDPOINTS ======================

@app.post("/history", response_model=HistoryResponse)
def add_to_history(
    history: HistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add content to watch history"""
    recent_time = datetime.utcnow() - timedelta(hours=24)
    existing = db.query(History).filter(
        History.user_id == current_user.id,
        History.content_type == history.content_type,
        History.content_id == history.content_id,
        History.viewed_at >= recent_time
    ).first()
    
    if existing:
        existing.viewed_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    new_history = History(
        user_id=current_user.id,
        content_type=history.content_type,
        content_id=history.content_id,
        title=history.title,
        poster_url=history.poster_url
    )
    db.add(new_history)
    db.commit()
    db.refresh(new_history)
    return new_history


@app.get("/history", response_model=List[HistoryResponse])
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20
):
    """Get watch history"""
    history = db.query(History).filter(
        History.user_id == current_user.id
    ).order_by(History.viewed_at.desc()).limit(limit).all()
    return history


@app.delete("/history/all")
def delete_all_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all watch history"""
    try:
        deleted_count = db.query(History).filter(
            History.user_id == current_user.id
        ).delete()
        db.commit()
        return {"message": f"All history cleared ({deleted_count} items deleted)"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to clear history: {str(e)}")


@app.delete("/history/{history_id}")
def delete_history_item(
    history_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete single history item"""
    history_item = db.query(History).filter(
        History.id == history_id,
        History.user_id == current_user.id
    ).first()
    
    if not history_item:
        raise HTTPException(status_code=404, detail="History item not found")
    
    db.delete(history_item)
    db.commit()
    return {"message": "History item deleted"}


# ====================== RATINGS ENDPOINTS ======================

@app.post("/ratings", response_model=RatingResponse)
def add_or_update_rating(
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add or update rating"""
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.content_type == rating_data.content_type,
        Rating.content_id == rating_data.content_id
    ).first()
    
    if existing_rating:
        existing_rating.rating = rating_data.rating
        existing_rating.review = rating_data.review
        existing_rating.rated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_rating)
        rating_to_return = existing_rating
    else:
        new_rating = Rating(
            user_id=current_user.id,
            content_type=rating_data.content_type,
            content_id=rating_data.content_id,
            title=rating_data.title,
            poster_url=rating_data.poster_url,
            rating=rating_data.rating,
            review=rating_data.review
        )
        db.add(new_rating)
        rating_to_return = new_rating
    
    # Create activity for feed
    activity = Activity(
        user_id=current_user.id,
        activity_type="rating",
        content_type=rating_data.content_type,
        content_id=rating_data.content_id,
        content_title=rating_data.title,
        content_poster=rating_data.poster_url,
        rating_value=rating_data.rating
    )
    db.add(activity)
    
    db.commit()
    db.refresh(rating_to_return)
    return rating_to_return


@app.get("/ratings", response_model=List[RatingResponse])
def get_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    content_type: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    sort_by: str = Query("rated_at")
):
    """Get all user ratings"""
    query = db.query(Rating).filter(Rating.user_id == current_user.id)
    
    if content_type:
        query = query.filter(Rating.content_type == content_type)
    
    if min_rating:
        query = query.filter(Rating.rating >= min_rating)
    
    if sort_by == "rating":
        query = query.order_by(Rating.rating.desc())
    elif sort_by == "title":
        query = query.order_by(Rating.title)
    else:
        query = query.order_by(Rating.rated_at.desc())
    
    return query.all()


@app.get("/ratings/{content_type}/{content_id}")
def get_rating(
    content_type: str,
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rating for specific content"""
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.content_type == content_type,
        Rating.content_id == content_id
    ).first()
    
    if rating:
        return {
            "has_rating": True,
            "rating": rating.rating,
            "review": rating.review,
            "rated_at": rating.rated_at,
            "rating_id": rating.id
        }
    return {"has_rating": False}


@app.put("/ratings/{rating_id}", response_model=RatingResponse)
def update_rating(
    rating_id: int,
    rating_update: RatingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update rating"""
    rating = db.query(Rating).filter(
        Rating.id == rating_id,
        Rating.user_id == current_user.id
    ).first()
    
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    rating.rating = rating_update.rating
    rating.review = rating_update.review
    rating.rated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(rating)
    return rating


@app.delete("/ratings/{rating_id}")
def delete_rating(
    rating_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete rating"""
    rating = db.query(Rating).filter(
        Rating.id == rating_id,
        Rating.user_id == current_user.id
    ).first()
    
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    db.delete(rating)
    db.commit()
    return {"message": "Rating deleted successfully"}


@app.get("/ratings/stats")
def get_ratings_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get rating statistics"""
    ratings = db.query(Rating).filter(Rating.user_id == current_user.id).all()
    
    if not ratings:
        return {
            "total_ratings": 0,
            "average_rating": 0,
            "highest_rated": None,
            "lowest_rated": None
        }
    
    ratings_list = [r.rating for r in ratings]
    average = sum(ratings_list) / len(ratings_list)
    highest = max(ratings, key=lambda x: x.rating)
    lowest = min(ratings, key=lambda x: x.rating)
    
    return {
        "total_ratings": len(ratings),
        "average_rating": round(average, 1),
        "highest_rated": {
            "title": highest.title,
            "rating": highest.rating,
            "poster_url": highest.poster_url
        },
        "lowest_rated": {
            "title": lowest.title,
            "rating": lowest.rating,
            "poster_url": lowest.poster_url
        }
    }


# ====================== SOCIAL FEATURES: FOLLOW SYSTEM ======================

@app.post("/follow/{username}")
def follow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Follow a user"""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == target_user.id
    ).first()
    
    if existing:
        return {"message": "Already following", "is_following": True}
    
    new_follow = Follow(
        follower_id=current_user.id,
        following_id=target_user.id
    )
    db.add(new_follow)
    
    # Create activity
    activity = Activity(
        user_id=current_user.id,
        activity_type="follow",
        target_user_id=target_user.id,
        target_username=target_user.username
    )
    db.add(activity)
    
    db.commit()
    return {"message": f"Now following {username}", "is_following": True}


@app.delete("/follow/{username}")
def unfollow_user(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unfollow a user"""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == target_user.id
    ).first()
    
    if not follow:
        return {"message": "Not following this user", "is_following": False}
    
    db.delete(follow)
    db.commit()
    return {"message": f"Unfollowed {username}", "is_following": False}


@app.get("/follow/check/{username}")
def check_follow_status(
    username: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if current user follows target user"""
    target_user = db.query(User).filter(User.username == username).first()
    if not target_user:
        return {"is_following": False}
    
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id,
        Follow.following_id == target_user.id
    ).first()
    
    return {"is_following": follow is not None}


@app.get("/followers", response_model=List[FollowerDetail])
def get_followers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users following current user"""
    followers = db.query(User, Follow).join(
        Follow, Follow.follower_id == User.id
    ).filter(Follow.following_id == current_user.id).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "followed_at": follow.created_at
        }
        for user, follow in followers
    ]


@app.get("/following", response_model=List[FollowerDetail])
def get_following(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get list of users current user is following"""
    following = db.query(User, Follow).join(
        Follow, Follow.following_id == User.id
    ).filter(Follow.follower_id == current_user.id).all()
    
    return [
        {
            "id": user.id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "bio": user.bio,
            "followed_at": follow.created_at
        }
        for user, follow in following
    ]


# ====================== PUBLIC USER PROFILES ======================

@app.get("/users/{username}", response_model=UserPublicProfile)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    """Get public profile of any user"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    followers_count = db.query(Follow).filter(Follow.following_id == user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user.id).count()
    ratings_count = db.query(Rating).filter(Rating.user_id == user.id).count()
    
    return {
        "id": user.id,
        "username": user.username,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at,
        "followers_count": followers_count,
        "following_count": following_count,
        "ratings_count": ratings_count
    }


@app.get("/users/{username}/ratings", response_model=List[RatingResponse])
def get_user_ratings(username: str, db: Session = Depends(get_db), limit: int = 20):
    """Get public ratings of a user"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    ratings = db.query(Rating).filter(
        Rating.user_id == user.id
    ).order_by(Rating.rated_at.desc()).limit(limit).all()
    
    return ratings


@app.put("/profile", response_model=UserResponse)
def update_profile(
    profile_data: UserUpdateProfile,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    if profile_data.bio is not None:
        current_user.bio = profile_data.bio
    if profile_data.avatar_url is not None:
        current_user.avatar_url = profile_data.avatar_url
    
    db.commit()
    db.refresh(current_user)
    return current_user


# ====================== ACTIVITY FEED ======================

@app.get("/feed", response_model=List[ActivityResponse])
def get_activity_feed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """Get activity feed from followed users"""
    following_ids = db.query(Follow.following_id).filter(
        Follow.follower_id == current_user.id
    ).all()
    following_ids = [fid[0] for fid in following_ids]
    
    if not following_ids:
        return []
    
    activities = db.query(Activity, User).join(
        User, Activity.user_id == User.id
    ).filter(
        Activity.user_id.in_(following_ids)
    ).order_by(Activity.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": activity.id,
            "user_id": activity.user_id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "activity_type": activity.activity_type,
            "content_type": activity.content_type,
            "content_id": activity.content_id,
            "content_title": activity.content_title,
            "content_poster": activity.content_poster,
            "rating_value": activity.rating_value,
            "target_user_id": activity.target_user_id,
            "target_username": activity.target_username,
            "created_at": activity.created_at
        }
        for activity, user in activities
    ]


# ====================== DETAIL ENDPOINTS ======================

@app.get("/movie/{movie_id}")
def get_movie_details(movie_id: int):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}"
    params = {"api_key": TMDB_API_KEY, "append_to_response": "credits,videos,similar"}
    response = requests.get(url, params=params)
    return response.json()


@app.get("/tv/{tv_id}")
def get_tv_details(tv_id: int):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}"
    params = {"api_key": TMDB_API_KEY, "append_to_response": "credits,videos,similar"}
    response = requests.get(url, params=params)
    return response.json()


@app.get("/anime/{anime_id}")
def get_anime_details(anime_id: int):
    url = f"https://api.jikan.moe/v4/anime/{anime_id}/full"
    response = requests.get(url)
    time.sleep(0.5)
    return response.json()


# ====================== ADVANCED FILTER ENDPOINTS ======================

@app.get("/discover-movies")
def discover_movies(
    year_min: int = Query(1900),
    year_max: int = Query(2025),
    rating_min: float = Query(0.0),
    language: str = Query(""),
    sort_by: str = Query("popularity.desc"),
    with_genres: str = Query(""),
    page: int = Query(1)
):
    url = "https://api.themoviedb.org/3/discover/movie"
    params = {
        "api_key": TMDB_API_KEY,
        "primary_release_date.gte": f"{year_min}-01-01",
        "primary_release_date.lte": f"{year_max}-12-31",
        "vote_average.gte": rating_min,
        "sort_by": sort_by,
        "page": page
    }
    if language:
        params["with_original_language"] = language
    if with_genres:
        params["with_genres"] = with_genres
    
    response = requests.get(url, params=params)
    return response.json()


@app.get("/discover-tv")
def discover_tv(
    year_min: int = Query(1900),
    year_max: int = Query(2025),
    rating_min: float = Query(0.0),
    language: str = Query(""),
    sort_by: str = Query("popularity.desc"),
    with_genres: str = Query(""),
    page: int = Query(1)
):
    url = "https://api.themoviedb.org/3/discover/tv"
    params = {
        "api_key": TMDB_API_KEY,
        "first_air_date.gte": f"{year_min}-01-01",
        "first_air_date.lte": f"{year_max}-12-31",
        "vote_average.gte": rating_min,
        "sort_by": sort_by,
        "page": page
    }
    if language:
        params["with_original_language"] = language
    if with_genres:
        params["with_genres"] = with_genres
    
    response = requests.get(url, params=params)
    return response.json()


@app.get("/discover-anime")
def discover_anime(
    year_min: int = Query(1960),
    year_max: int = Query(2025),
    rating_min: float = Query(0.0),
    genre: str = Query(None),
    sort_by: str = Query("popularity"),
    page: int = Query(1)
):
    sort_map = {
        "POPULARITY_DESC": "popularity",
        "SCORE_DESC": "score",
        "START_DATE_DESC": "start_date",
        "START_DATE": "start_date",
        "TITLE_ROMAJI": "title",
        "popularity.desc": "popularity",
        "vote_average.desc": "score"
    }
    
    url = "https://api.jikan.moe/v4/anime"
    params = {
        "order_by": sort_map.get(sort_by, "popularity"),
        "sort": "desc",
        "limit": 20,
        "page": page
    }
    
    if rating_min > 0:
        params["min_score"] = rating_min
    
    genre_map = {
        "Action": 1, "Adventure": 2, "Comedy": 4, "Drama": 8,
        "Fantasy": 10, "Horror": 14, "Mystery": 7, "Psychological": 40,
        "Romance": 22, "Sci-Fi": 24, "Slice of Life": 36, "Sports": 30,
        "Supernatural": 37, "Thriller": 41, "Shounen": 27
    }
    
    if genre:
        genre_id = genre_map.get(genre)
        if genre_id:
            params["genres"] = genre_id
    
    try:
        response = requests.get(url, params=params)
        time.sleep(0.5)
        if response.status_code == 200:
            return response.json()
        else:
            return {"data": []}
    except Exception as e:
        print(f"Jikan API error: {e}")
        return {"data": []}


@app.get("/movie-genres")
def get_movie_genres():
    url = "https://api.themoviedb.org/3/genre/movie/list"
    params = {"api_key": TMDB_API_KEY}
    return requests.get(url, params=params).json()


@app.get("/tv-genres")
def get_tv_genres():
    url = "https://api.themoviedb.org/3/genre/tv/list"
    params = {"api_key": TMDB_API_KEY}
    return requests.get(url, params=params).json()


# ====================== HEALTH CHECK ======================

@app.get("/")
def read_root():
    return {"status": "MediaMingle API is running with Social Features!"}
