from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi
import numpy as np
import requests

app = Flask(__name__)
CORS(app)

NODE_BASE_URL = "http://localhost:5000/api"

print("⏳ Loading ML Model (This takes a few seconds)...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model Loaded and Server is Ready!")

def fetch_all_courses():
    """Loops through all paginated pages to get every course in the DB."""
    all_courses = []
    current_page = 1
    
    while True:
        try:
            res = requests.get(f"{NODE_BASE_URL}/skills?page={current_page}&limit=50")
            if not res.ok: break
            
            data = res.json()
            courses = data.get('data', [])
            all_courses.extend(courses)
            
            total_pages = data.get('pagination', {}).get('pages', 1)
            if current_page >= total_pages: break
            current_page += 1
        except Exception as e:
            print(f"Error fetching page {current_page}: {e}")
            break
    return all_courses

def hybrid_rank_courses(user_topics, courses, top_n=6): 
    if not courses or not user_topics:
        return []

    # 1. Prepare the rich text for every course
    rich_texts = []
    for course in courses:
        title = course.get('title', '')
        category = course.get('category', '')
        skills_str = " ".join(course.get('skills', []))
        # Combine all relevant text into a single searchable block
        rich_texts.append(f"{title} {category} {skills_str}".lower())

    user_query_str = " ".join(user_topics).lower()

    # ==========================================
    # Phase 1: Semantic Search (Sentence Transformers)
    # ==========================================
    # Embed the user query and all course texts
    query_embedding = model.encode([user_query_str])
    course_embeddings = model.encode(rich_texts)
    
    # Calculate Cosine Similarity (Returns a matrix, we grab the first row)
    semantic_scores = cosine_similarity(query_embedding, course_embeddings)[0]
    
    # Normalize semantic scores between 0 and 1
    if max(semantic_scores) > 0:
        semantic_scores = (semantic_scores - min(semantic_scores)) / (max(semantic_scores) - min(semantic_scores))

    # ==========================================
    # Phase 2: Lexical Search (Exact Keyword Match via BM25)
    # ==========================================
    # Tokenize the texts for BM25 (split into lists of words)
    tokenized_corpus = [text.split() for text in rich_texts]
    bm25 = BM25Okapi(tokenized_corpus)
    
    # Tokenize the user query and get BM25 scores
    tokenized_query = user_query_str.split()
    bm25_scores = bm25.get_scores(tokenized_query)
    
    # Normalize BM25 scores between 0 and 1
    if max(bm25_scores) > 0:
        bm25_scores = (bm25_scores - min(bm25_scores)) / (max(bm25_scores) - min(bm25_scores))

    # ==========================================
    # Phase 3: Hybrid Fusion (Combining the Scores)
    # ==========================================
    scored_courses = []
    for idx, course in enumerate(courses):
        # We weight exact keyword matches slightly higher (60%) than AI vibes (40%)
        final_score = (0.6 * bm25_scores[idx]) + (0.4 * semantic_scores[idx])
        scored_courses.append((course['title'], final_score))
        
    # Sort descending by the new hybrid score
    scored_courses.sort(key=lambda x: x[1], reverse=True)
    
    return [course_title for course_title, _ in scored_courses[:top_n]]

@app.route('/generate-recommendations', methods=['POST'])
def generate_recommendations():
    data = request.json
    user_id = data.get('userId')
    user_topics = data.get('skills', [])

    if not user_id or not user_topics:
        return jsonify({"success": False, "message": "Missing userId or skills"}), 400

    try:
        print(f"\n🧠 Generating Hybrid recommendations for {user_topics}...")
        
        all_courses = fetch_all_courses()
        
        # Run the Hybrid ranking algorithm
        top_courses = hybrid_rank_courses(user_topics, all_courses, top_n=6)

        print(f"🎯 Recommended: {top_courses}")
        return jsonify({"success": True, "recommendedTitles": top_courses})

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=False)