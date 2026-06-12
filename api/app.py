"""
VerifyAI Research Assistant API
Endpoints:
  GET  /                    — health check
  POST /predict/article     — analyze article text
  POST /predict/url         — fetch URL and analyze article
  POST /predict/quote       — LIAR model (short political statements)
"""
# ── External libraries ────────────────────────────────────────────────────────

from flask import Flask
from flask_cors import CORS
import os
from groq import Groq
from newsapi import NewsApiClient

from config.settings import settings
from auth.jwt_handler import generate_token
from auth.decorators import token_required
from repositories.users import (
    create_user, 
    get_user_by_username,
    username_exists,
    email_exists,
    increment_token_version,
)
from repositories.history import (get_history)

from services.predictor import (predict_and_respond)
from services.article_analysis import (analyze_article)
from services.title_generator import (generate_title)
from services.related_articles import (get_related_articles)
from services.text_utils import (strip_source_prefix)

from routes.auth import (auth_bp)
from routes.prediction import (prediction_bp)
from routes.system import (system_bp)

from database.pool import init_pool
from database.schema import init_schema
from database.predictions import log_prediction

app = Flask(__name__)
CORS(app)

app.register_blueprint(system_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(prediction_bp)


# ── External API clients ──────────────────────────────────────────────────────

# Groq
if settings.GROQ_API_KEY:
    groq_client = Groq(api_key=settings.GROQ_API_KEY)
    print("Groq client initialized.")
else:
    groq_client = None
    print("WARNING: GROQ_API_KEY not set — title generation disabled.")

# NewsAPI
if settings.NEWS_API_KEY:
    newsapi = NewsApiClient(api_key=settings.NEWS_API_KEY)
    print("NewsAPI client initialized.")
else:
    newsapi = None
    print("WARNING: NEWS_API_KEY not set — related articles disabled.")

app.groq_client = groq_client
app.newsapi = newsapi
app.log_prediction = log_prediction

# ── Run ───────────────────────────────────────────────────────────────────────
        
init_pool()
print("Database pool initialized.")

if __name__ == "__main__":
    app.run(debug=True, port=5000)