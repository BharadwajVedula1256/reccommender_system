# Netflix Recommender System UI

A modern, interactive web interface for the Netflix content recommender system using TF-IDF and Sentence Transformer models.

## Features

- **Smart Search**: Real-time autocomplete search for Netflix titles
- **Dual Recommendation Methods**:
  - TF-IDF based similarity (fast)
  - Sentence Transformer embeddings (better quality, requires embeddings file)
- **TMDB Integration**: Displays movie and TV show posters and backdrop images from The Movie Database API
- **Beautiful UI**: Netflix-inspired dark theme with smooth animations
- **Detailed Results**: View comprehensive information including cast, director, genres, and similarity scores
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Project Structure

```
reccommender_system/
├── app.py                      # Flask backend server
├── netflix_cleaned.csv         # Netflix dataset
├── netflix_embeddings.npy      # Pre-computed embeddings (optional)
├── Recommender.ipynb          # Original Jupyter notebook
├── requirements.txt           # Python dependencies
├── .env                       # Environment variables (not in git)
├── .env.example               # Example environment file
├── templates/
│   └── index.html            # Main HTML template
└── static/
    ├── style.css             # Styling
    └── script.js             # Frontend JavaScript
```

## Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up TMDB API** (for movie poster images):

   a. Get a free API key from The Movie Database:
      - Go to https://www.themoviedb.org/signup
      - Create an account
      - Navigate to Settings > API
      - Request an API key (choose "Developer" option)

   b. Create a `.env` file in the project root:
      ```bash
      cp .env.example .env
      ```

   c. Add your TMDB API key to the `.env` file:
      ```
      TMDB_API_KEY=your_actual_api_key_here
      ```

   **Note**: The app will work without TMDB API key, but won't display movie/TV show posters.

3. **Verify dataset**:
   Ensure `netflix_cleaned.csv` is in the project root directory.

4. **(Optional) Generate embeddings**:
   If you want to use the Sentence Transformer method, run the embedding generation code from the Jupyter notebook:
   ```python
   from sentence_transformers import SentenceTransformer
   import pandas as pd
   import numpy as np

   df = pd.read_csv('netflix_cleaned.csv')
   df['combined_text'] = (
       df['director'].fillna('') + ' ' +
       df['cast'].fillna('') + ' ' +
       df['listed_in'].fillna('') + ' ' +
       df['description'].fillna('') + ' ' +
       df['title'].fillna('')
   ).str.lower()

   model = SentenceTransformer('all-mpnet-base-v2')
   embeddings = model.encode(df['combined_text'], show_progress_bar=True)
   np.save('netflix_embeddings.npy', embeddings)
   ```

## Usage

1. **Start the Flask server**:
   ```bash
   python app.py
   ```

2. **Open your browser**:
   Navigate to `http://localhost:5000`

3. **Get recommendations**:
   - Type a Netflix title in the search box
   - Select from the autocomplete suggestions
   - Choose your preferred recommendation method
   - Click "Get Recommendations"

## API Endpoints

### GET `/api/search`
Search for titles matching a query.

**Parameters**:
- `q`: Search query string

**Response**: Array of matching titles

### POST `/api/recommend`
Get recommendations for a specific title.

**Request body**:
```json
{
  "title": "Friends",
  "method": "tfidf",
  "n": 10
}
```

**Response**:
```json
{
  "source": {...},
  "recommendations": [...]
}
```

### GET `/api/stats`
Get dataset statistics.

**Response**:
```json
{
  "total_titles": 8800,
  "movies": 6131,
  "tv_shows": 2669,
  "embedding_available": true
}
```

## Technologies Used

- **Backend**: Flask, Pandas, NumPy, scikit-learn, Sentence Transformers, python-dotenv
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **ML Models**: TF-IDF Vectorizer, Sentence Transformers (all-mpnet-base-v2)
- **External APIs**: TMDB (The Movie Database) API for movie/TV show images

## How It Works

1. **Data Processing**: The system combines title, director, cast, genres, and description into a unified text representation
2. **TF-IDF Method**: Uses Term Frequency-Inverse Document Frequency to create document vectors and calculate cosine similarity
3. **Embedding Method**: Uses pre-trained Sentence Transformers to generate semantic embeddings for more nuanced similarity matching
4. **Recommendation**: Returns top-N most similar titles based on cosine similarity scores
5. **Image Enhancement**: Fetches movie/TV show posters from TMDB API using title and year matching, with LRU caching to minimize API calls

## License

MIT License
