"""Compatibility facade for ML helpers and model instances."""

from ml.analysis import analyze_article, get_top_words, strip_source_prefix
from ml.enrichment import (
    build_apa_citation,
    extract_article_text_from_url,
    extract_relevant_excerpt,
    generate_title,
    get_related_articles,
)
from ml.models import liar_model, liar_vectorizer, isot_model, isot_vectorizer
from ml.pipeline import predict_text
