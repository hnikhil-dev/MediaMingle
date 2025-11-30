from fastapi import FastAPI, Query, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import requests
import os
from dotenv import load_dotenv
from typing import List, Optional
from database import get_db, init_db, User, Favorite, History
from schemas import UserCreate, UserLogin, UserResponse, Token, FavoriteCreate, FavoriteResponse, HistoryCreate, HistoryResponse

# Import our new modules
from database import get_db, init_db, User, Favorite
from auth import get_password_hash, verify_password, create_access_token, get_current_user, get_current_user_optional
from schemas import UserCreate, UserLogin, UserResponse, Token, FavoriteCreate, FavoriteResponse

load_dotenv()

app = FastAPI()

# Initialize database on startup
@app.on_event("startup")
def on_startup():
    init_db()

origins = [
    "http://localhost:3000",
    "https://mediamingle.onrender.com",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# Mood to Genre mapping (keep your existing one)
MOOD_TO_GENRE = {
    "happy": {
        "movies": [35, 10751, 16],
        "tv": [35, 10751],
        "anime_genres": ["Comedy", "Slice of Life", "Romance"]
    },
    "sad": {
        "movies": [18, 10749],
        "tv": [18],
        "anime_genres": ["Drama", "Romance", "Slice of Life"]
    },
    "exciting": {
        "movies": [28, 12, 878],
        "tv": [10759, 10765],
        "anime_genres": ["Action", "Adventure", "Shounen"]
    },
    "scary": {
        "movies": [27, 53],
        "tv": [9648, 80],
        "anime_genres": ["Horror", "Thriller", "Psychological"]
    },
    "thoughtful": {
        "movies": [18, 9648, 36],
        "tv": [18, 9648],
        "anime_genres": ["Psychological", "Mystery", "Drama"]
    },
    "relaxing": {
        "movies": [10751, 14, 16],
        "tv": [10751, 10764],
        "anime_genres": ["Slice of Life", "Comedy", "Music"]
    }
}

# ============ AUTH ENDPOINTS ============

@app.post("/signup", response_model=Token)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username exists
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create token
    access_token = create_access_token(data={"sub": new_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": db_user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@app.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ============ FAVORITES ENDPOINTS ============

@app.post("/favorites", response_model=FavoriteResponse)
def add_favorite(
    favorite: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.content_type == favorite.content_type,
        Favorite.content_id == favorite.content_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    new_favorite = Favorite(
        user_id=current_user.id,
        content_type=favorite.content_type,
        content_id=favorite.content_id,
        title=favorite.title,
        poster_url=favorite.poster_url
    )
    db.add(new_favorite)
    db.commit()
    db.refresh(new_favorite)
    
    return new_favorite

@app.get("/favorites", response_model=List[FavoriteResponse])
def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    content_type: Optional[str] = None
):
    query = db.query(Favorite).filter(Favorite.user_id == current_user.id)
    
    if content_type:
        query = query.filter(Favorite.content_type == content_type)
    
    favorites = query.order_by(Favorite.added_at.desc()).all()
    return favorites

@app.delete("/favorites/{favorite_id}")
def remove_favorite(
    favorite_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorite = db.query(Favorite).filter(
        Favorite.id == favorite_id,
        Favorite.user_id == current_user.id
    ).first()
    
    if not favorite:
        raise HTTPException(status_code=404, detail="Favorite not found")
    
    db.delete(favorite)
    db.commit()
    
    return {"message": "Removed from favorites"}

@app.get("/favorites/check/{content_type}/{content_id}")
def check_favorite(
    content_type: str,
    content_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.content_type == content_type,
        Favorite.content_id == content_id
    ).first()
    
    return {"is_favorite": favorite is not None, "favorite_id": favorite.id if favorite else None}

# ============ EXISTING CONTENT ENDPOINTS ============

@app.get("/")
def read_root():
    return {"message": "Welcome to MediaMingle Backend"}

@app.get("/trending-movies")
def trending_movies():
    url = f"https://api.themoviedb.org/3/trending/movie/week"
    params = {"api_key": TMDB_API_KEY}
    return requests.get(url, params=params).json()

@app.get("/search-movies")
def search_movies(query: str = Query(..., min_length=1)):
    url = "https://api.themoviedb.org/3/search/movie"
    params = {"api_key": TMDB_API_KEY, "query": query}
    return requests.get(url, params=params).json()

@app.get("/trending-tv")
def trending_tv():
    url = f"https://api.themoviedb.org/3/trending/tv/week"
    params = {"api_key": TMDB_API_KEY}
    return requests.get(url, params=params).json()

@app.get("/search-tv")
def search_tv(query: str = Query(..., min_length=1)):
    url = "https://api.themoviedb.org/3/search/tv"
    params = {"api_key": TMDB_API_KEY, "query": query}
    return requests.get(url, params=params).json()

@app.get("/trending-anime")
def trending_anime():
    url = "https://api.jikan.moe/v4/top/anime"
    params = {"filter": "bypopularity", "limit": 20}
    response = requests.get(url, params=params).json()
    return response

@app.get("/search-anime")
def search_anime(query: str = Query(..., min_length=1)):
    url = "https://api.jikan.moe/v4/anime"
    params = {"q": query, "limit": 20}
    return requests.get(url, params=params).json()

@app.get("/recommend")
def recommend(mood: str = Query(...), content_type: str = Query("movies")):
    mood = mood.lower()
    
    if mood not in MOOD_TO_GENRE:
        return {"error": "Invalid mood"}
    
    if content_type == "movies":
        genres = MOOD_TO_GENRE[mood]["movies"]
        url = "https://api.themoviedb.org/3/discover/movie"
        params = {
            "api_key": TMDB_API_KEY,
            "with_genres": ",".join(map(str, genres)),
            "sort_by": "popularity.desc",
            "page": 1
        }
        return requests.get(url, params=params).json()
    
    elif content_type == "tv":
        genres = MOOD_TO_GENRE[mood]["tv"]
        url = "https://api.themoviedb.org/3/discover/tv"
        params = {
            "api_key": TMDB_API_KEY,
            "with_genres": ",".join(map(str, genres)),
            "sort_by": "popularity.desc",
            "page": 1
        }
        return requests.get(url, params=params).json()
    
    elif content_type == "anime":
        genres = MOOD_TO_GENRE[mood]["anime_genres"]
        url = "https://api.jikan.moe/v4/anime"
        params = {
            "genres": genres[0] if genres else "",
            "order_by": "popularity",
            "sort": "asc",
            "limit": 20
        }
        return requests.get(url, params=params).json()
    
    return {"error": "Invalid content type"}

# ============ HISTORY ENDPOINTS ============

@app.post("/history", response_model=HistoryResponse)
def add_to_history(
    history: HistoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if already in history (viewed in last 24 hours)
    from datetime import timedelta
    recent_time = datetime.utcnow() - timedelta(hours=24)
    
    existing = db.query(History).filter(
        History.user_id == current_user.id,
        History.content_type == history.content_type,
        History.content_id == history.content_id,
        History.viewed_at > recent_time
    ).first()
    
    if existing:
        # Update viewed time
        existing.viewed_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    
    # Add new history entry
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
    history = db.query(History).filter(
        History.user_id == current_user.id
    ).order_by(History.viewed_at.desc()).limit(limit).all()
    
    return history

@app.delete("/history")
def clear_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(History).filter(History.user_id == current_user.id).delete()
    db.commit()
    return {"message": "History cleared"}

# ============ DETAIL ENDPOINTS ============

@app.get("/movie/{movie_id}")
def get_movie_details(movie_id: int):
    # Get movie details
    url = f"https://api.themoviedb.org/3/movie/{movie_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "append_to_response": "credits,videos,similar"
    }
    response = requests.get(url, params=params)
    return response.json()

@app.get("/tv/{tv_id}")
def get_tv_details(tv_id: int):
    # Get TV show details
    url = f"https://api.themoviedb.org/3/tv/{tv_id}"
    params = {
        "api_key": TMDB_API_KEY,
        "append_to_response": "credits,videos,similar"
    }
    response = requests.get(url, params=params)
    return response.json()

@app.get("/anime/{anime_id}")
def get_anime_details(anime_id: int):
    # Get anime details from Jikan
    url = f"https://api.jikan.moe/v4/anime/{anime_id}/full"
    response = requests.get(url)
    return response.json()

# ============ ADVANCED FILTER ENDPOINTS ============

@app.get("/discover-movies")
def discover_movies(
    year_min: int = Query(1900),
    year_max: int = Query(2025),
    rating_min: float = Query(0.0),
    language: str = Query("en"),
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
        "with_original_language": language,
        "sort_by": sort_by,
        "page": page
    }
    
    if with_genres:
        params["with_genres"] = with_genres
    
    response = requests.get(url, params=params)
    return response.json()

@app.get("/discover-tv")
def discover_tv(
    year_min: int = Query(1900),
    year_max: int = Query(2025),
    rating_min: float = Query(0.0),
    language: str = Query("en"),
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
        "with_original_language": language,
        "sort_by": sort_by,
        "page": page
    }
    
    if with_genres:
        params["with_genres"] = with_genres
    
    response = requests.get(url, params=params)
    return response.json()

# ============ ANILIST API FOR BETTER ANIME ============

@app.get("/discover-anime")
def discover_anime(
    year_min: int = Query(1960),
    year_max: int = Query(2025),
    rating_min: int = Query(0),
    season: str = Query(None),
    genre: str = Query(None),
    sort_by: str = Query("POPULARITY_DESC"),
    page: int = Query(1)
):
    """
    Use AniList GraphQL API for better anime discovery
    """
    url = "https://graphql.anilist.co"
    
    # Build GraphQL query
    query = """
    query ($page: Int, $seasonYear_greater: Int, $seasonYear_lesser: Int, $averageScore_greater: Int, $season: MediaSeason, $genre: String, $sort: [MediaSort]) {
      Page(page: $page, perPage: 20) {
        media(
          type: ANIME,
          seasonYear_greater: $seasonYear_greater,
          seasonYear_lesser: $seasonYear_lesser,
          averageScore_greater: $averageScore_greater,
          season: $season,
          genre: $genre,
          sort: $sort
        ) {
          id
          title {
            english
            romaji
          }
          coverImage {
            large
            extraLarge
          }
          bannerImage
          averageScore
          seasonYear
          episodes
          format
          genres
          description
          trailer {
            id
            site
          }
        }
      }
    }
    """
    
    variables = {
        "page": page,
        "seasonYear_greater": year_min - 1,
        "seasonYear_lesser": year_max + 1,
        "averageScore_greater": rating_min,
        "sort": [sort_by]
    }
    
    if season:
        variables["season"] = season.upper()
    
    if genre:
        variables["genre"] = genre
    
    response = requests.post(url, json={"query": query, "variables": variables})
    return response.json()

@app.get("/anime-anilist/{anime_id}")
def get_anime_anilist_details(anime_id: int):
    """
    Get detailed anime info from AniList
    """
    url = "https://graphql.anilist.co"
    
    query = """
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          english
          romaji
          native
        }
        coverImage {
          large
          extraLarge
        }
        bannerImage
        description
        averageScore
        seasonYear
        season
        episodes
        duration
        format
        status
        genres
        studios {
          nodes {
            name
          }
        }
        characters(sort: ROLE) {
          edges {
            role
            node {
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
        trailer {
          id
          site
        }
        recommendations(sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id
              title {
                english
                romaji
              }
              coverImage {
                large
              }
              averageScore
            }
          }
        }
      }
    }
    """
    
    variables = {"id": anime_id}
    
    response = requests.post(url, json={"query": query, "variables": variables})
    return response.json()

# Genre mappings for TMDb
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
