"""Application factory for VerifyAI."""

import os
import sys


PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from db.bootstrap import initialize_backend
from routes.auth import auth_bp
from routes.predictions import predictions_bp


def create_app():
    load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

    app = Flask(__name__)
    CORS(app)

    app.config["JWT_SECRET"] = os.getenv("JWT_SECRET")

    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        from groq import Groq

        app.extensions["groq_client"] = Groq(api_key=groq_api_key)
        print("Groq client initialized.")
    else:
        app.extensions["groq_client"] = None
        print("WARNING: GROQ_API_KEY not set — title generation disabled.")

    news_api_key = os.getenv("NEWS_API_KEY")
    if news_api_key:
        from newsapi import NewsApiClient

        app.extensions["newsapi"] = NewsApiClient(api_key=news_api_key)
        print("NewsAPI client initialized.")
    else:
        app.extensions["newsapi"] = None
        print("WARNING: NEWS_API_KEY not set — related articles disabled.")

    try:
        initialize_backend()
        print("Database ready.")
    except Exception as exc:
        print("Database initialization failed:", exc)

    @app.route("/", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "message": "VerifyAI Research Assistant API running."})

    app.register_blueprint(auth_bp)
    app.register_blueprint(predictions_bp)

    return app