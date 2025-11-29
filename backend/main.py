from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import requests
import os
from dotenv import load_dotenv

app = FastAPI()
load_dotenv()

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

# Mood to Genre mapping
MOOD_TO_GENRE = {
    "happy": {
        "movies": [35, 10751, 16],  # Comedy, Family, Animation
        "tv": [35, 10751],
        "anime_genres": ["Comedy", "Slice of Life", "Romance"]
    },
    "sad": {
        "movies": [18, 10749],  # Drama, Romance
        "tv": [18],
        "anime_genres": ["Drama", "Romance", "Slice of Life"]
    },
    "exciting": {
        "movies": [28, 12, 878],  # Action, Adventure, Sci-Fi
        "tv": [10759, 10765],
        "anime_genres": ["Action", "Adventure", "Shounen"]
    },
    "scary": {
        "movies": [27, 53],  # Horror, Thriller
        "tv": [9648, 80],
        "anime_genres": ["Horror", "Thriller", "Psychological"]
    },
    "thoughtful": {
        "movies": [18, 9648, 36],  # Drama, Mystery, History
        "tv": [18, 9648],
        "anime_genres": ["Psychological", "Mystery", "Drama"]
    },
    "relaxing": {
        "movies": [10751, 14, 16],  # Family, Fantasy, Animation
        "tv": [10751, 10764],
        "anime_genres": ["Slice of Life", "Comedy", "Music"]
    }
}

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
    response = requests.get(url, params=params)
    return response.json()

@app.get("/search-anime")
def search_anime(query: str = Query(..., min_length=1)):
    url = "https://api.jikan.moe/v4/anime"
    params = {"q": query, "limit": 20}
    return requests.get(url, params=params).json()

# NEW: Mood-based recommendations
@app.get("/recommend")
def recommend(mood: str = Query(...), content_type: str = Query("movies")):
    mood = mood.lower()
    
    if mood not in MOOD_TO_GENRE:
        return {"error": "Invalid mood. Choose from: happy, sad, exciting, scary, thoughtful, relaxing"}
    
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
        # Jikan search with genre filter
        url = "https://api.jikan.moe/v4/anime"
        params = {
            "genres": genres[0] if genres else "",
            "order_by": "popularity",
            "sort": "asc",
            "limit": 20
        }
        return requests.get(url, params=params).json()
    
    return {"error": "Invalid content type"}
