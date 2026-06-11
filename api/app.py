"""
Fake News Detection API
Endpoints:
  GET  /                  — health check
  POST /predict/article   — ISOT model (full news articles)
  POST /predict/quote     — LIAR model (short political statements)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import datetime
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
import jwt
from functools import wraps
from dotenv import load_dotenv
import bcrypt

import psycopg2
from psycopg2.extras import RealDictCursor
from db import init_pool, init_schema


load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET")

app = Flask(__name__)
CORS(app)

# ── Paths ─────────────────────────────────────────────────────────────────────

BASE_DIR  = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")
DATA_DIR  = os.path.join(BASE_DIR, "..", "data")

ISOT_MODEL_PATH = os.path.join(MODEL_DIR, "isot_model.pkl")
ISOT_VEC_PATH   = os.path.join(MODEL_DIR, "isot_vectorizer.pkl")
#LIAR_MODEL_PATH = os.path.join(MODEL_DIR, "liar_model.pkl")
LIAR_VEC_PATH   = os.path.join(MODEL_DIR, "liar_vectorizer.pkl")

ISOT_CLEAN_PATH = os.path.join(DATA_DIR, "processed", "isot_clean.csv")
FAKE_RAW_PATH   = os.path.join(DATA_DIR, "raw", "Fake.csv")
TRUE_RAW_PATH   = os.path.join(DATA_DIR, "raw", "True.csv")


# ── Load models ───────────────────────────────────────────────────────────────

print("Loading models...")
isot_model      = joblib.load(ISOT_MODEL_PATH)
isot_vectorizer = joblib.load(ISOT_VEC_PATH)
#liar_model      = joblib.load(LIAR_MODEL_PATH)
#liar_vectorizer = joblib.load(LIAR_VEC_PATH)
print("Models loaded.")


# ── Build suggestion index ────────────────────────────────────────────────────
#
# We load the cleaned ISOT dataset and keep only REAL articles (label=1)
# for use as suggestion candidates. We also recover titles from the original
# raw CSVs since the cleaning step merged title+text into a single field.
#
# The TF-IDF matrix for all real articles is precomputed once at startup so
# that suggestion lookups at request time are just a cosine similarity call —
# fast even against 20k+ rows.

print("Building suggestion index...")

# Load cleaned data — label + content
isot_clean = pd.read_csv(ISOT_CLEAN_PATH)

# Recover titles from raw CSVs
fake_raw = pd.read_csv(FAKE_RAW_PATH)[["title", "text"]].copy()
true_raw = pd.read_csv(TRUE_RAW_PATH)[["title", "text"]].copy()
fake_raw["label"] = 0
true_raw["label"] = 1
raw_combined = pd.concat([fake_raw, true_raw], ignore_index=True)

# Merge titles back into cleaned data by matching on text snippet
# (first 100 chars of text is a reliable enough join key)
raw_combined["text_key"] = raw_combined["text"].str.strip().str[:200]
isot_clean["text_key"]   = isot_clean["content"].str.strip().str[:200]
isot_with_titles = isot_clean.merge(
    raw_combined[["text_key", "title"]], on="text_key", how="left"
)

# Fill any unmatched titles with first 100 chars of content
isot_with_titles["title"] = isot_with_titles["title"].fillna(
    isot_with_titles["content"].str[:100].str.strip()
)

# Keep only REAL articles as suggestion candidates
real_articles = isot_with_titles[isot_with_titles["label"] == 1].reset_index(drop=True)

# Precompute TF-IDF matrix for all real articles
real_tfidf_matrix = isot_vectorizer.transform(real_articles["content"])

print(f"Suggestion index built — {len(real_articles):,} real articles indexed.")


# ── PostgreSQL logging ────────────────────────────────────────────────────────────

def log_prediction(mode, input_text, verdict, confidence):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO predictions (mode, input, verdict, confidence, timestamp)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                mode,
                input_text[:500],
                verdict,
                confidence,
                datetime.datetime.utcnow().isoformat()
            )
        )

        conn.commit()

    except Exception as e:
        conn.rollback()
        print(f"DB log error: {e}")

    finally:
        cursor.close()
        conn.close()

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        cursor_factory=RealDictCursor
    )

def get_top_words(vectorizer, tfidf_vector, n=5):
    """Return the top-n words with the highest TF-IDF scores for this input."""
    feature_names = vectorizer.get_feature_names_out()
    scores = tfidf_vector.toarray()[0]
    top_indices = scores.argsort()[::-1][:n]
    return [
        {"word": feature_names[i], "score": round(float(scores[i]), 4)}
        for i in top_indices
        if scores[i] > 0
    ]


def get_suggestions(input_tfidf, top_words, n=5, min_word_overlap=3):
    """
    Find the top-n real articles most similar to the input using cosine
    similarity on TF-IDF vectors. We also require that at least
    min_word_overlap of the input's top words appear in the candidate article
    so that suggestions are topically relevant, not just stylistically similar.

    Returns a list of dicts with title, snippet, and similarity score.
    """
    input_words = {w["word"] for w in top_words}

    # Cosine similarity between input and all real articles
    similarities = cosine_similarity(input_tfidf, real_tfidf_matrix).flatten()

    # Rank by similarity descending
    ranked_indices = similarities.argsort()[::-1]

    suggestions = []
    for idx in ranked_indices:
        if len(suggestions) >= n:
            break

        article_content = real_articles.iloc[idx]["content"]

        # Count how many of the input's top words appear in this article
        overlap = sum(1 for word in input_words if word in article_content.lower())
        if overlap < min_word_overlap:
            continue

        title   = real_articles.iloc[idx]["title"]
        # Snippet: first 300 chars of content after the title portion
        snippet = article_content[:300].strip() + "..."

        suggestions.append({
            "title":      str(title),
            "snippet":    snippet,
            "similarity": round(float(similarities[idx]), 4),
            "overlap":    overlap,
        })

    return suggestions


# ── Core prediction logic ─────────────────────────────────────────────────────

def predict_and_respond(text, model, vectorizer, mode, labels, include_suggestions=False):
    tfidf      = vectorizer.transform([text])
    prediction = int(model.predict(tfidf)[0])
    proba      = model.predict_proba(tfidf)[0]
    confidence = round(float(proba[prediction]) * 100, 1)
    verdict    = labels[prediction]
    top_words  = get_top_words(vectorizer, tfidf)

    user_id = getattr(request, "user", {}).get("user_id")
    log_prediction(user_id,mode, text, verdict, confidence)

    response = {
        "verdict":    verdict,
        "confidence": confidence,
        "label":      prediction,
        "top_words":  top_words,
        "mode":       mode,
    }

    # Add suggestions for article mode only
    if include_suggestions:
        suggestions = get_suggestions(tfidf, top_words)
        # Framing depends on verdict
        if verdict == "FAKE":
            framing = "You may want to read these verified real articles on a similar topic:"
        else:
            framing = "More on this topic:"
        response["suggestions"] = {
            "framing":  framing,
            "articles": suggestions,
        }

    return jsonify(response)

# ── Authentication decorator ────────────────────────────────────────────────

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):

        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Token is missing!"}), 401
        try:
            token = auth_header.split(" ")[1]

            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"]
            ) 

            request.user = payload
        
        except Exception:
            return jsonify({"error": "Token is invalid!"}), 401
        
        return f(*args, **kwargs)
    return decorated
# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Fake News Detection API running."})


@app.route("/predict/article", methods=["POST"])
@token_required
def predict_article():
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Field 'text' is required and must not be empty."}), 400

    text = data["text"].strip()
    if len(text.split()) < 10:
        return jsonify({"error": "Article text is too short. Please paste the full article body."}), 400

    return predict_and_respond(
        text, isot_model, isot_vectorizer,
        mode="article",
        labels={0: "FAKE", 1: "REAL"},
        include_suggestions=True,
    )


@app.route("/predict/quote", methods=["POST"])
def predict_quote():
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Field 'text' is required and must not be empty."}), 400

    text = data["text"].strip()
    if len(text.split()) < 3:
        return jsonify({"error": "Statement is too short. Please enter a complete sentence or quote."}), 400

    return predict_and_respond(
        text, liar_model, liar_vectorizer,
        mode="quote",
        labels={0: "MISLEADING", 1: "CREDIBLE"},
        include_suggestions=False,
    )

@app.route("/history", methods=["GET"])
@token_required
def history():
    user_id = request.user.get("user_id")

    limit = request.args.get("limit", 20, type=int)
    offset = request.args.get("offset", 0, type=int)

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            SELECT id, mode, input, verdict, confidence, timestamp
            FROM predictions
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT %s OFFSET %s
            """,
            (user_id, limit, offset)
        )

        rows = cursor.fetchall()

        return jsonify({
            "history": rows,
            "limiy": limit,
            "offset": offset,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
        
    finally:
        cursor.close()
        conn.close()

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({
            "error": "Username, email, and password are required."
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Check username
        cursor.execute(
            "SELECT id FROM users WHERE username = %s",
            (username,)
        )

        if cursor.fetchone():
            return jsonify({
                "error": "Username already exists."
            }), 409

        # Check email
        cursor.execute(
            "SELECT id FROM users WHERE email = %s",
            (email,)
        )

        if cursor.fetchone():
            return jsonify({
                "error": "Email already exists."
            }), 409

        # Hash password
        password_hash = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # Insert user
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (username, email, password_hash)
        )

        user_id = cursor.fetchone()["id"]

        conn.commit()

        return jsonify({
            "message": "User registered successfully.",
            "user_id": user_id
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    username = data["username"]
    password = data["password"]

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
    "SELECT id, username, password_hash FROM users WHERE username = %s",
    (username,)
)

    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if not user:
        return jsonify({"error": "Invalid username"}), 401

    stored_hash = user["password_hash"]

    if not bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8')):
        return jsonify({"error": "Invalid password"}), 401

    token = jwt.encode(
        {
            "user_id": user["id"],
            "username": user["username"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        },
        JWT_SECRET,
        algorithm="HS256"
    )

    return jsonify({"token": token})

# ── Run ───────────────────────────────────────────────────────────────────────
        
try:
    init_pool()
    init_schema()
    print("Database ready.")
except Exception as e:
    print("Database initialization failed:", e)

if __name__ == "__main__":
    app.run(debug=True, port=5000)
