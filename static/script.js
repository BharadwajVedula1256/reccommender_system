// DOM Elements
const searchInput = document.getElementById('search-input');
const suggestionsDiv = document.getElementById('suggestions');
const recommendBtn = document.getElementById('recommend-btn');
const methodSelect = document.getElementById('method-select');
const countSelect = document.getElementById('count-select');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const resultsSection = document.getElementById('results-section');
const sourceTitleDiv = document.getElementById('source-title');
const recommendationsGrid = document.getElementById('recommendations-grid');
const recCount = document.getElementById('rec-count');

// Stats
const totalTitles = document.getElementById('total-titles');
const moviesCount = document.getElementById('movies');
const tvShowsCount = document.getElementById('tv-shows');

// State
let selectedTitle = '';
let searchTimeout = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    setupEventListeners();
});

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        totalTitles.textContent = stats.total_titles.toLocaleString();
        moviesCount.textContent = stats.movies.toLocaleString();
        tvShowsCount.textContent = stats.tv_shows.toLocaleString();

        // Enable embedding option if available
        if (stats.embedding_available) {
            methodSelect.querySelector('option[value="embedding"]').disabled = false;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    searchInput.addEventListener('input', handleSearch);
    searchInput.addEventListener('focus', () => {
        if (suggestionsDiv.children.length > 0) {
            suggestionsDiv.classList.add('active');
        }
    });

    // Click outside to close suggestions
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.classList.remove('active');
        }
    });

    // Recommend button
    recommendBtn.addEventListener('click', getRecommendations);

    // Enter key to trigger recommendations
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && recommendBtn.disabled === false) {
            getRecommendations();
        }
    });
}

// Handle search input
function handleSearch(e) {
    const query = e.target.value.trim();

    // Clear previous timeout
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    // Clear suggestions if query is too short
    if (query.length < 2) {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.classList.remove('active');
        recommendBtn.disabled = true;
        return;
    }

    // Debounce search
    searchTimeout = setTimeout(() => {
        searchTitles(query);
    }, 300);
}

// Search for titles
async function searchTitles(query) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const titles = await response.json();

        displaySuggestions(titles);
    } catch (error) {
        console.error('Error searching titles:', error);
    }
}

// Display search suggestions
function displaySuggestions(titles) {
    suggestionsDiv.innerHTML = '';

    if (titles.length === 0) {
        suggestionsDiv.classList.remove('active');
        return;
    }

    titles.forEach(title => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerHTML = `
            <div class="suggestion-title">${escapeHtml(title.title)}</div>
            <div class="suggestion-meta">${title.type} • ${title.release_year}</div>
        `;

        item.addEventListener('click', () => {
            selectTitle(title.title);
        });

        suggestionsDiv.appendChild(item);
    });

    suggestionsDiv.classList.add('active');
}

// Select a title
function selectTitle(title) {
    selectedTitle = title;
    searchInput.value = title;
    suggestionsDiv.classList.remove('active');
    recommendBtn.disabled = false;
}

// Get recommendations
async function getRecommendations() {
    if (!selectedTitle) return;

    // Hide previous results and errors
    resultsSection.classList.remove('active');
    errorMessage.classList.remove('active');
    loading.classList.add('active');

    try {
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: selectedTitle,
                method: methodSelect.value,
                n: parseInt(countSelect.value)
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get recommendations');
        }

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        showError(error.message);
    } finally {
        loading.classList.remove('active');
    }
}

// Display results
function displayResults(data) {
    // Display source title
    displaySourceTitle(data.source);

    // Display recommendations
    displayRecommendations(data.recommendations);

    // Show results section
    resultsSection.classList.add('active');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Display source title
function displaySourceTitle(source) {
    const genres = source.listed_in || 'N/A';
    const cast = source.cast || 'N/A';
    const director = source.director || 'N/A';

    sourceTitleDiv.innerHTML = `
        <div class="source-label">You selected:</div>
        <div class="source-name">${escapeHtml(source.title)}</div>
        <div class="source-details">
            <span class="source-tag">${source.type}</span>
            <span class="source-tag">${source.release_year}</span>
            <span class="source-tag">${source.rating}</span>
            <span class="source-tag">${source.duration}</span>
        </div>
        <div class="source-description">${escapeHtml(source.description)}</div>
    `;
}

// Display recommendations
function displayRecommendations(recommendations) {
    recCount.textContent = `${recommendations.length} recommendations found`;
    recommendationsGrid.innerHTML = '';

    recommendations.forEach((rec, index) => {
        const card = createRecommendationCard(rec, index);
        recommendationsGrid.appendChild(card);
    });
}

// Create recommendation card
function createRecommendationCard(rec, index) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';

    const cast = rec.cast && rec.cast !== 'Unknown' ? rec.cast : 'Cast information not available';
    const director = rec.director && rec.director !== 'Unknown' ? rec.director : 'Director information not available';
    const genres = rec.listed_in || 'N/A';

    // Calculate similarity percentage
    const similarityPercent = Math.round(rec.similarity * 100);

    card.innerHTML = `
        <div class="card-header">
            <div class="card-title">${escapeHtml(rec.title)}</div>
            <div class="card-meta">
                <span class="meta-badge">${rec.type}</span>
                <span class="meta-badge">${rec.release_year}</span>
                <span class="meta-badge">${rec.rating}</span>
                <span class="meta-badge">${rec.duration}</span>
            </div>
        </div>
        <div class="card-body">
            <div class="card-genres">${escapeHtml(genres)}</div>
            <div class="card-description">${escapeHtml(rec.description)}</div>
            <div class="card-cast"><strong>Cast:</strong> ${escapeHtml(cast)}</div>
            <div class="card-cast"><strong>Director:</strong> ${escapeHtml(director)}</div>
        </div>
        <div class="card-footer">
            <div class="similarity-score">
                <span class="score-label">Match:</span>
                <span class="score-value">${similarityPercent}%</span>
            </div>
            <div class="score-bar">
                <div class="score-fill" style="width: ${similarityPercent}%"></div>
            </div>
        </div>
    `;

    // Animate card appearance
    setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }, index * 50);

    return card;
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('active');

    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('active');
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
