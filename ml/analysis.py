"""Core text-analysis helpers used by the ML pipeline."""

import re

import textstat
from textblob import TextBlob


def strip_source_prefix(text):
    """Remove Reuters and similar location prefixes that can confuse the model."""
    text = re.sub(r'^[A-Z\s,/]+\(Reuters\)\s*[-–]\s*', '', text)
    text = re.sub(r'^21st Century Wire says\s*', '', text)
    return text.strip()


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


def analyze_article(text):
    """Run local linguistic analysis on article text."""
    blob = TextBlob(text)

    polarity = round(blob.sentiment.polarity, 3)
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

    grade = round(textstat.flesch_kincaid_grade(text), 1)
    reading_ease = round(textstat.flesch_reading_ease(text), 1)

    return {
        "sentiment": {
            "polarity": polarity,
            "polarity_label": polarity_label,
            "subjectivity": subjectivity,
            "subjectivity_label": subjectivity_label,
        },
        "readability": {
            "grade_level": grade,
            "reading_ease": reading_ease,
        },
        "stats": {
            "word_count": len(text.split()),
            "sentence_count": textstat.sentence_count(text),
            "exclamation_count": text.count("!"),
            "caps_words": len([word for word in text.split() if word.isupper() and len(word) > 2]),
        },
    }
