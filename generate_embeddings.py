#!/usr/bin/env python
"""Generate embeddings for Netflix dataset using Sentence Transformers"""

import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import os

print("=" * 60)
print("Netflix Embeddings Generator")
print("=" * 60)

# Check if embeddings already exist
if os.path.exists('netflix_embeddings.npy'):
    print("\n⚠️  WARNING: netflix_embeddings.npy already exists!")
    response = input("Do you want to regenerate it? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Aborted.")
        exit(0)

# Load dataset
print("\n1. Loading dataset...")
df = pd.read_csv('netflix_cleaned.csv')
print(f"   ✓ Loaded {len(df)} titles")

# Create combined text
print("\n2. Creating combined text features...")
df['combined_text'] = (
    df['director'].fillna('') + ' ' +
    df['cast'].fillna('') + ' ' +
    df['listed_in'].fillna('') + ' ' +
    df['description'].fillna('') + ' ' +
    df['title'].fillna('')
).str.lower()
print("   ✓ Combined text created")

# Load model
print("\n3. Loading Sentence Transformer model (all-mpnet-base-v2)...")
print("   (This will download ~400MB on first run)")
model = SentenceTransformer('all-mpnet-base-v2')
print("   ✓ Model loaded")

# Generate embeddings
print("\n4. Generating embeddings (this may take 5-15 minutes)...")
embeddings = model.encode(
    df['combined_text'].tolist(),
    show_progress_bar=True,
    convert_to_tensor=False,
    batch_size=32
)
print(f"   ✓ Embeddings generated: {embeddings.shape}")

# Save embeddings
print("\n5. Saving embeddings to netflix_embeddings.npy...")
np.save('netflix_embeddings.npy', embeddings)
file_size = os.path.getsize('netflix_embeddings.npy') / (1024 * 1024)
print(f"   ✓ Embeddings saved ({file_size:.1f} MB)")

print("\n" + "=" * 60)
print("✓ SUCCESS! Embeddings file created.")
print("=" * 60)
print("\nYou can now:")
print("1. Restart your Flask app: python app.py")
print("2. The Sentence Transformer option will be enabled automatically")
print("=" * 60)
