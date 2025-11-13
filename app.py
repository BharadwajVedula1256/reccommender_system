from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os
import requests
from functools import lru_cache
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# TMDB API Configuration
TMDB_API_KEY = os.getenv('TMDB_API_KEY', '')
TMDB_BASE_URL = 'https://api.themoviedb.org/3'
TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

# Load data and prepare recommender system
df = pd.read_csv('netflix_cleaned.csv')
df['combined_text'] = (
    df['director'].fillna('') + ' ' +
    df['cast'].fillna('') + ' ' +
    df['listed_in'].fillna('') + ' ' +
    df['description'].fillna('') + ' ' +
    df['title'].fillna('')
).str.lower()

# Initialize TF-IDF
tfidf = TfidfVectorizer(stop_words='english', max_features=10_000)
tfidf_matrix = tfidf.fit_transform(df['combined_text'])
tfidf_sim = cosine_similarity(tfidf_matrix)

# Try to load embeddings if available
embed_sim = None
embeddings_path = 'netflix_embeddings.npy'
if os.path.exists(embeddings_path):
    embeddings = np.load(embeddings_path)
    embed_sim = cosine_similarity(embeddings)

# TMDB API Functions
@lru_cache(maxsize=1000)
def search_tmdb(title, media_type, year=None):
    """Search TMDB for a title and return the poster path"""
    if not TMDB_API_KEY:
        return None

    try:
        # Determine media type for TMDB
        tmdb_media_type = 'movie' if media_type == 'Movie' else 'tv'

        # Search for the title
        search_url = f'{TMDB_BASE_URL}/search/{tmdb_media_type}'
        params = {
            'api_key': TMDB_API_KEY,
            'query': title,
            'include_adult': False
        }

        if year and tmdb_media_type == 'movie':
            params['year'] = year
        elif year and tmdb_media_type == 'tv':
            params['first_air_date_year'] = year

        response = requests.get(search_url, params=params, timeout=5)

        if response.status_code == 200:
            results = response.json().get('results', [])
            if results:
                # Get the first result's poster path
                poster_path = results[0].get('poster_path')
                backdrop_path = results[0].get('backdrop_path')

                return {
                    'poster': f'{TMDB_IMAGE_BASE_URL}{poster_path}' if poster_path else None,
                    'backdrop': f'{TMDB_IMAGE_BASE_URL}{backdrop_path}' if backdrop_path else None
                }
    except Exception as e:
        print(f'Error fetching TMDB data for {title}: {e}')

    return None

def add_tmdb_images(content_list):
    """Add TMDB images to a list of content items"""
    for item in content_list:
        title = item.get('title', '')
        media_type = item.get('type', 'Movie')
        year = item.get('release_year')

        # Search TMDB for images
        tmdb_data = search_tmdb(title, media_type, year)

        if tmdb_data:
            item['poster_url'] = tmdb_data.get('poster')
            item['backdrop_url'] = tmdb_data.get('backdrop')
        else:
            item['poster_url'] = None
            item['backdrop_url'] = None

    return content_list

def recommend(title, similarity_matrix, n=10):
    """Get recommendations for a given title"""
    title_clean = title.lower().strip()
    matches = df[df['title'].str.lower() == title_clean]

    if matches.empty:
        return None

    idx = matches.index[0]
    sim_scores = list(enumerate(similarity_matrix[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:n+1]
    indices = [i[0] for i in sim_scores]

    # Get the source title info
    source = df.iloc[idx].to_dict()

    # Get recommendations
    recs = df.iloc[indices][['title', 'type', 'listed_in', 'release_year', 'description', 'cast', 'director', 'rating', 'duration']].copy()
    recs['similarity'] = [round(similarity_matrix[idx][i], 3) for i in indices]

    # Convert to dict
    recommendations = recs.to_dict('records')

    # Add TMDB images to source and recommendations
    source_list = [source]
    add_tmdb_images(source_list)
    add_tmdb_images(recommendations)

    return {
        'source': source_list[0],
        'recommendations': recommendations
    }

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/api/search', methods=['GET'])
def search_titles():
    """Search for titles matching a query"""
    query = request.args.get('q', '').lower()
    if len(query) < 2:
        return jsonify([])

    matches = df[df['title'].str.lower().str.contains(query, na=False)]
    titles = matches[['title', 'type', 'release_year']].head(10).to_dict('records')
    return jsonify(titles)

@app.route('/api/recommend', methods=['POST'])
def get_recommendations():
    """Get recommendations for a title"""
    data = request.json
    title = data.get('title', '')
    method = data.get('method', 'tfidf')
    n = data.get('n', 10)

    if not title:
        return jsonify({'error': 'Title is required'}), 400

    # Choose similarity matrix
    sim_matrix = tfidf_sim
    if method == 'embedding' and embed_sim is not None:
        sim_matrix = embed_sim

    result = recommend(title, sim_matrix, n)

    if result is None:
        return jsonify({'error': f'Title "{title}" not found'}), 404

    return jsonify(result)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get dataset statistics"""
    stats = {
        'total_titles': len(df),
        'movies': len(df[df['type'] == 'Movie']),
        'tv_shows': len(df[df['type'] == 'TV Show']),
        'embedding_available': embed_sim is not None
    }
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
