"""Prediction routes."""

from flask import Blueprint, current_app, jsonify, request

from auth_utils import token_required
from db.queries import get_user_predictions, log_prediction
from ml.prediction_service import (
    extract_article_text_from_url,
    isot_model,
    isot_vectorizer,
    liar_model,
    liar_vectorizer,
    predict_text,
)


predictions_bp = Blueprint("predictions", __name__)


def _safe_log_prediction(user_id, input_text, verdict, confidence, top_words):
    if not user_id:
        return None
    try:
        return log_prediction(user_id, input_text, verdict, confidence, top_words)
    except Exception as exc:
        print(f"DB log error: {exc}")
        return None


@predictions_bp.route("/predict/article", methods=["POST"])
@token_required
def predict_article():
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Field 'text' is required and must not be empty."}), 400

    text = data["text"].strip()
    if len(text.split()) < 10:
        return jsonify({"error": "Article text is too short. Please paste the full article body."}), 400

    response = predict_text(
        text,
        isot_model,
        isot_vectorizer,
        mode="article",
        labels={0: "FAKE", 1: "REAL"},
        include_analysis=True,
        groq_client=current_app.extensions.get("groq_client"),
        news_client=current_app.extensions.get("newsapi"),
    )
    _safe_log_prediction(request.user.get("user_id"), text, response["verdict"], response["confidence"], response["top_words"])
    return jsonify(response)


@predictions_bp.route("/predict/url", methods=["POST"])
@token_required
def predict_url():
    data = request.get_json(silent=True)
    if not data or not data.get("url", "").strip():
        return jsonify({"error": "Field 'url' is required and must not be empty."}), 400

    url = data["url"].strip()

    try:
        text = extract_article_text_from_url(url)
    except Exception as exc:
        return jsonify({"error": f"Failed to fetch URL: {str(exc)}"}), 400

    if not text:
        return jsonify({
            "error": (
                "Could not extract article text from this URL. "
                "The site may be paywalled or block automated access. "
                "Try pasting the article text directly instead."
            )
        }), 422

    if len(text.split()) < 10:
        return jsonify({"error": "Extracted text is too short. Try pasting the article text directly."}), 400

    response = predict_text(
        text,
        isot_model,
        isot_vectorizer,
        mode="article",
        labels={0: "FAKE", 1: "REAL"},
        include_analysis=True,
        groq_client=current_app.extensions.get("groq_client"),
        news_client=current_app.extensions.get("newsapi"),
    )
    _safe_log_prediction(request.user.get("user_id"), text, response["verdict"], response["confidence"], response["top_words"])
    return jsonify(response)


@predictions_bp.route("/predict/quote", methods=["POST"])
@token_required
def predict_quote():
    data = request.get_json(silent=True)
    if not data or not data.get("text", "").strip():
        return jsonify({"error": "Field 'text' is required and must not be empty."}), 400

    text = data["text"].strip()
    if len(text.split()) < 3:
        return jsonify({"error": "Statement is too short. Please enter a complete sentence or quote."}), 400

    response = predict_text(
        text,
        liar_model,
        liar_vectorizer,
        mode="quote",
        labels={0: "MISLEADING", 1: "CREDIBLE"},
        include_analysis=False,
    )
    _safe_log_prediction(request.user.get("user_id"), text, response["verdict"], response["confidence"], response["top_words"])
    return jsonify(response)


@predictions_bp.route("/history", methods=["GET"])
@token_required
def history():
    user_id = request.user.get("user_id")
    limit = request.args.get("limit", 20, type=int)
    offset = request.args.get("offset", 0, type=int)

    try:
        rows = get_user_predictions(user_id, limit=limit, offset=offset)
        return jsonify({"history": rows, "limit": limit, "offset": offset})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500