"""
VerifyAI Research Assistant API
Endpoints:
  GET  /                    — health check
  POST /predict/article     — analyze article text
  POST /predict/url         — fetch URL and analyze article
  POST /predict/quote       — LIAR model (short political statements)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import joblib
import os
import datetime
import numpy as np
import re

load_dotenv()

# ── External libraries ────────────────────────────────────────────────────────
import trafilatura
from textblob import TextBlob
import textstat
from groq import Groq
from newsapi import NewsApiClient

app = Flask(__name__)
CORS(app)

# ── Paths ─────────────────────────────────────────────────────────────────────

BASE_DIR  = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

ISOT_MODEL_PATH = os.path.join(MODEL_DIR, "isot_model.pkl")
ISOT_VEC_PATH   = os.path.join(MODEL_DIR, "isot_vectorizer.pkl")
LIAR_MODEL_PATH = os.path.join(MODEL_DIR, "liar_model.pkl")
LIAR_VEC_PATH   = os.path.join(MODEL_DIR, "liar_vectorizer.pkl")


# ── Load models ───────────────────────────────────────────────────────────────

print("Loading models...")
isot_model      = joblib.load(ISOT_MODEL_PATH)
isot_vectorizer = joblib.load(ISOT_VEC_PATH)
liar_model      = joblib.load(LIAR_MODEL_PATH)
liar_vectorizer = joblib.load(LIAR_VEC_PATH)
print("Models loaded.")


# ── External API clients ──────────────────────────────────────────────────────

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("Groq client initialized.")
else:
    groq_client = None
    print("WARNING: GROQ_API_KEY not set — title generation disabled.")

# NewsAPI
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
if NEWS_API_KEY:
    newsapi = NewsApiClient(api_key=NEWS_API_KEY)
    print("NewsAPI client initialized.")
else:
    newsapi = None
    print("WARNING: NEWS_API_KEY not set — related articles disabled.")


# ── Database logging (PostgreSQL via db.py) ───────────────────────────────────

try:
    from db import init_pool, init_schema, log_prediction as db_log_prediction
    init_pool()
    init_schema()
    USE_DB = True
    print("PostgreSQL connected.")
except Exception as e:
    print(f"WARNING: Database unavailable ({e}) — predictions will not be logged.")
    USE_DB = False


def log_prediction(user_id, input_text, verdict, confidence, top_words):
    if not USE_DB:
        return None
    try:
        return db_log_prediction(user_id, input_text, verdict, confidence, top_words)
    except Exception as e:
        print(f"DB log error: {e}")
        return None


# ── Helper: TF-IDF top words ──────────────────────────────────────────────────

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


# ── Helper: Article analysis ──────────────────────────────────────────────────

def analyze_article(text):
    """
    Run local linguistic analysis on article text.
    Returns sentiment, subjectivity, reading level, and surface statistics.
    All computed locally — no API calls.
    """
    blob = TextBlob(text)

    polarity     = round(blob.sentiment.polarity, 3)
    subjectivity = round(blob.sentiment.subjectivity, 3)

    if polarity > 0.2:
        polarity_label = "Positive"
    elif polarity < -0.2:
        polarity_label = "Negative"
    else:
        polarity_label = "Neutral"

    if subjectivity > 0.6:
        subjectivity_label = "Highly opinionated"
    elif subjectivity > 0.4:
        subjectivity_label = "Somewhat opinionated"
    else:
        subjectivity_label = "Mostly objective"

    grade        = round(textstat.flesch_kincaid_grade(text), 1)
    reading_ease = round(textstat.flesch_reading_ease(text), 1)

    word_count        = len(text.split())
    sentence_count    = textstat.sentence_count(text)
    exclamation_count = text.count("!")
    caps_words        = len([w for w in text.split() if w.isupper() and len(w) > 2])

    return {
        "sentiment": {
            "polarity":           polarity,
            "polarity_label":     polarity_label,
            "subjectivity":       subjectivity,
            "subjectivity_label": subjectivity_label,
        },
        "readability": {
            "grade_level":  grade,
            "reading_ease": reading_ease,
        },
        "stats": {
            "word_count":        word_count,
            "sentence_count":    sentence_count,
            "exclamation_count": exclamation_count,
            "caps_words":        caps_words,
        }
    }


# ── Helper: Groq title generation ────────────────────────────────────────────

def generate_title(text, top_words=None):
    """
    Use Groq (Llama 3) to generate a short 5-7 word title summarizing the topic.
    Used for history labels and as the search query for NewsAPI.
    Falls back to top TF-IDF words if Groq is unavailable.
    """
    if not groq_client:
        if top_words:
            return " ".join([w["word"] for w in top_words[:4]])
        return re.sub(r'[^\w\s]', '', text[:50]).strip()

    try:
        prompt = (
            "Generate a concise 5-7 word title that captures the main topic of this news article. "
            "Return only the title, no punctuation at the end, no quotes, nothing else.\n\n"
            f"Article:\n{text[:1500]}"
        )
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=20,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Groq error: {e}")
        if top_words:
            return " ".join([w["word"] for w in top_words[:4]])
        return re.sub(r'[^\w\s]', '', text[:50]).strip()


# ── Helper: APA citation builder ─────────────────────────────────────────────

def build_apa_citation(article):
    """
    Build an APA 7th edition citation from a NewsAPI article object.
    Format: Author, A. A. (Year, Month Day). Title. Publication. URL
    If author missing, publication name moves to author position per APA guidelines.
    """
    title       = article.get("title", "Untitled").rstrip(".")
    url         = article.get("url", "")
    source_name = article.get("source", {}).get("name", "Unknown Source")

    published_at = article.get("publishedAt", "")
    try:
        dt = datetime.datetime.strptime(published_at[:10], "%Y-%m-%d")
        date_str = dt.strftime("%Y, %B %-d")
    except Exception:
        date_str = "n.d."

    raw_author = article.get("author", "") or ""
    if "@" in raw_author:
        raw_author = ""

    if raw_author.strip():
        parts = raw_author.strip().split()
        if len(parts) >= 2:
            author_str = f"{parts[-1]}, {parts[0][0]}."
        else:
            author_str = raw_author.strip()
        citation = f"{author_str} ({date_str}). {title}. {source_name}. {url}"
    else:
        citation = f"{source_name}. ({date_str}). {title}. {url}"

    return citation


# ── Helper: Extract relevant excerpt ─────────────────────────────────────────

def extract_relevant_excerpt(article_text, top_words, max_length=300):
    """
    Find the sentence in the related article with the most keyword overlap
    with the input article's top TF-IDF words.
    """
    if not article_text:
        return ""

    input_words = {w["word"].lower() for w in top_words}
    sentences   = re.split(r'(?<=[.!?])\s+', article_text)

    best_sentence = ""
    best_overlap  = 0

    for sentence in sentences:
        sentence_lower = sentence.lower()
        overlap = sum(1 for word in input_words if word in sentence_lower)
        if overlap > best_overlap:
            best_overlap  = overlap
            best_sentence = sentence

    if not best_sentence and sentences:
        best_sentence = sentences[0]

    if len(best_sentence) > max_length:
        best_sentence = best_sentence[:max_length].strip() + "..."

    return best_sentence


# ── Helper: Fetch related articles from NewsAPI ───────────────────────────────

def get_related_articles(search_title, top_words, n=3):
    """
    Search NewsAPI for articles related to search_title.
    Returns list of dicts with title, source, url, excerpt, and APA citation.
    """
    if not newsapi:
        return []

    if not search_title or not search_title.strip():
        return []

    try:
        response = newsapi.get_everything(
            q=search_title,
            language="en",
            sort_by="relevancy",
            page_size=10,
        )

        articles = response.get("articles", [])
        results  = []

        for article in articles:
            if len(results) >= n:
                break

            content = article.get("content") or article.get("description") or ""
            if not content:
                continue

            if "[Removed]" in content or not article.get("title"):
                continue

            excerpt  = extract_relevant_excerpt(content, top_words)
            citation = build_apa_citation(article)

            results.append({
                "title":        article.get("title", ""),
                "source":       article.get("source", {}).get("name", ""),
                "url":          article.get("url", ""),
                "published_at": article.get("publishedAt", "")[:10],
                "excerpt":      excerpt,
                "citation":     citation,
            })

        return results

    except Exception as e:
        print(f"NewsAPI error: {e}")
        return []


# ── Helper: Strip source prefixes ────────────────────────────────────────────

def strip_source_prefix(text):
    """Remove Reuters and similar location prefixes that can confuse the model."""
    text = re.sub(r'^[A-Z\s,/]+\(Reuters\)\s*[-–]\s*', '', text)
    text = re.sub(r'^21st Century Wire says\s*', '', text)
    return text.strip()


# ── Core prediction logic ─────────────────────────────────────────────────────

def predict_and_respond(text, model, vectorizer, mode, labels, run_dashboard=False):
    """
    Run ML prediction and optionally build the full research dashboard.
    """
    text = strip_source_prefix(text)

    tfidf      = vectorizer.transform([text])
    prediction = int(model.predict(tfidf)[0])
    proba      = model.predict_proba(tfidf)[0]
    confidence = round(float(proba[prediction]) * 100, 1)
    verdict    = labels[prediction]
    top_words  = get_top_words(vectorizer, tfidf)

    log_prediction(None, text, verdict, confidence, top_words)

    response = {
        "verdict":    verdict,
        "confidence": confidence,
        "label":      prediction,
        "top_words":  top_words,
        "mode":       mode,
    }

    if run_dashboard:
        response["analysis"] = analyze_article(text)

        title = generate_title(text, top_words)
        response["generated_title"] = title

        related = get_related_articles(title, top_words)

        if verdict == "FAKE":
            framing = "Here is what verified sources are actually reporting on this topic:"
        else:
            framing = "Related sources to deepen your research on this topic:"

        response["related_articles"] = {
            "framing":  framing,
            "articles": related,
        }

    return jsonify(response)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "VerifyAI Research Assistant API running."})


@app.route("/predict/article", methods=["POST"])
def predict_article():
    """Analyze article from pasted text."""
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
        run_dashboard=True,
    )


@app.route("/predict/url", methods=["POST"])
def predict_url():
    """Fetch article from a URL and analyze it."""
    data = request.get_json(silent=True)
    if not data or not data.get("url", "").strip():
        return jsonify({"error": "Field 'url' is required and must not be empty."}), 400

    url = data["url"].strip()

    try:
        downloaded = trafilatura.fetch_url(url)
        text = trafilatura.extract(downloaded)
    except Exception as e:
        return jsonify({"error": f"Failed to fetch URL: {str(e)}"}), 400

    if not text:
        return jsonify({
            "error": "Could not extract article text from this URL. "
                     "The site may be paywalled or block automated access. "
                     "Try pasting the article text directly instead."
        }), 422

    if len(text.split()) < 10:
        return jsonify({"error": "Extracted text is too short. Try pasting the article text directly."}), 400

    return predict_and_respond(
        text, isot_model, isot_vectorizer,
        mode="article",
        labels={0: "FAKE", 1: "REAL"},
        run_dashboard=True,
    )


@app.route("/predict/quote", methods=["POST"])
def predict_quote():
    """Analyze a short political statement or quote."""
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
        run_dashboard=False,
    )


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)
