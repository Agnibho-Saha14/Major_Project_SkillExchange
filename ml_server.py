# ml_server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import requests

app = Flask(__name__)
CORS(app)

NODE_BASE_URL = "http://localhost:5000/api"

print("⏳ Loading ML Model (This takes a few seconds)...")
# The model loads ONLY ONCE when you start the server!
model = SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Model Loaded and Server is Ready!")

def get_relevance_score(user_topics, course_title):
    course_embedding = model.encode([course_title])
    scores = []
    for topic in user_topics:
        topic_embedding = model.encode([topic])
        sim = cosine_similarity(topic_embedding, course_embedding)[0][0]
        scores.append(sim)
        
    if not scores: return 0
    return (0.7 * max(scores)) + (0.3 * np.mean(scores))

def rank_courses(user_topics, course_titles, top_n=3): # Set to 3 for better UX
    scored_courses = [(course, get_relevance_score(user_topics, course)) for course in course_titles]
    scored_courses.sort(key=lambda x: x[1], reverse=True)
    return [course for course, _ in scored_courses[:top_n]]

# This is the endpoint your Node.js server will hit
@app.route('/generate-recommendations', methods=['POST'])
def generate_recommendations():
    data = request.json
    user_id = data.get('userId')
    user_topics = data.get('skills', [])

    if not user_id or not user_topics:
        return jsonify({"success": False, "message": "Missing userId or skills"}), 400

    try:
        print(f"🧠 Generating real-time recommendations for {user_id}...")
        
        # 1. Fetch all courses from your Node backend
        courses_response = requests.get(f"{NODE_BASE_URL}/skills").json()
        all_course_titles = [course['title'] for course in courses_response.get('data', [])]

        # 2. Run the instant AI ranking
        top_courses = rank_courses(user_topics, all_course_titles, top_n=3)

        # 3. Return the results to Node.js
        print(f"🎯 Recommended: {top_courses}")
        return jsonify({"success": True, "recommendedTitles": top_courses})

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == '__main__':
    # Runs the Python server on port 5001 so it doesn't conflict with Node (5000)
    app.run(port=5001, debug=False)