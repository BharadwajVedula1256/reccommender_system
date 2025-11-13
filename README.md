# Netflix Recommender System UI

A modern, interactive web interface for the Netflix content recommender system using TF-IDF and Sentence Transformer models.

## Features

- **Smart Search**: Real-time autocomplete search for Netflix titles
- **Dual Recommendation Methods**:
  - TF-IDF based similarity (fast)
  - Sentence Transformer embeddings (better quality, requires embeddings file)
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

2. **Verify dataset**:
   Ensure `netflix_cleaned.csv` is in the project root directory.

3. **(Optional) Generate embeddings**:
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

- **Backend**: Flask, Pandas, NumPy, scikit-learn, Sentence Transformers
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **ML Models**: TF-IDF Vectorizer, Sentence Transformers (all-mpnet-base-v2)

## How It Works

1. **Data Processing**: The system combines title, director, cast, genres, and description into a unified text representation
2. **TF-IDF Method**: Uses Term Frequency-Inverse Document Frequency to create document vectors and calculate cosine similarity
3. **Embedding Method**: Uses pre-trained Sentence Transformers to generate semantic embeddings for more nuanced similarity matching
4. **Recommendation**: Returns top-N most similar titles based on cosine similarity scores

## License

MIT License
