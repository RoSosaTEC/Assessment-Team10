from textblob import TextBlob
import textstat

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