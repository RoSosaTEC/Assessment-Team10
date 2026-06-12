from flask import (Blueprint, request, jsonify,current_app)
import trafilatura
from auth.decorators import (token_required)
from services.predictor import (predict_and_respond)
from services.model_registry import (ISOT_MODEL, ISOT_VECTORIZER)
from services.text_utils import strip_source_prefix
from services.article_analysis import analyze_article
from services.title_generator import generate_title
from services.related_articles import get_related_articles

prediction_bp = Blueprint("prediction", __name__)

@prediction_bp.route("/predict/quote", methods=["POST"])
@token_required
def predict_quote():
    """Analyze a short political statement or quote."""
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Field 'text' is required and must not be empty."}), 400

    text = data["text"].strip()
    if len(text.split()) < 3:
        return jsonify({"error": "Statement is too short. Please enter a complete sentence or quote."}), 400

    return predict_and_respond(
        text = text,
        model = liar_model,
        vectorizer = LIAR_VECTORIZER,
        mode = "quote",
        labels = {
            0: "MISLEADING",
            1: "CREDIBLE"
        },
        run_dashboard = True,
        strip_source_prefix = strip_source_prefix,
        analyze_article = analyze_article,
        generate_title = lambda text,top_words: generate_title(text, top_words, current_app.groq_client),
        get_related_articles = lambda title, top_words: get_related_articles(title, top_words, current_app.newsapi),
        log_prediction = current_app.log_prediction,
        user_id = request.user.get("user_id")

    )

@prediction_bp.route("/predict/url", methods=["POST"])
@token_required
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
        text = text,
        model = ISOT_MODEL,
        vectorizer = ISOT_VECTORIZER,
        mode = "article",
        labels = {
            0: "FAKE",
            1: "REAL"
        },
        run_dashboard = True,
        strip_source_prefix = strip_source_prefix,
        analyze_article = analyze_article,
        generate_title = lambda text,top_words: generate_title(text, top_words, current_app.groq_client),
        get_related_articles = lambda title, top_words: get_related_articles(title, top_words, current_app.newsapi),
        log_prediction = current_app.log_prediction,
        user_id = request.user.get("user_id")
    )

@prediction_bp.route("/predict/article", methods=["POST"])
@token_required
def predict_article():
    """Analyze article from pasted text."""
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Field 'text' is required and must not be empty."}), 400

    text = data["text"].strip()
    if len(text.split()) < 10:
        return jsonify({"error": "Article text is too short. Please paste the full article body."}), 400

    return predict_and_respond(
        text = text,
        model = ISOT_MODEL,
        vectorizer = ISOT_VECTORIZER,
        mode = "article",
        labels = {
            0: "FAKE",
            1: "REAL"
        },
        run_dashboard = True,
        strip_source_prefix = strip_source_prefix,
        analyze_article = analyze_article,
        generate_title = lambda text,top_words: generate_title(text, top_words, current_app.groq_client),
        get_related_articles = lambda title, top_words: get_related_articles(title, top_words, current_app.newsapi),
        log_prediction = current_app.log_prediction,
        user_id = request.user.get("user_id")

    )