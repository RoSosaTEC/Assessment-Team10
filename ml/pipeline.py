"""Prediction pipeline orchestration."""

from ml.analysis import analyze_article, get_top_words, strip_source_prefix
from ml.enrichment import generate_title, get_related_articles


def predict_text(text, model, vectorizer, mode, labels, include_analysis=False, groq_client=None, news_client=None):
    """Run the ML pipeline and return a response dictionary."""
    text = strip_source_prefix(text)

    tfidf = vectorizer.transform([text])
    prediction = int(model.predict(tfidf)[0])
    proba = model.predict_proba(tfidf)[0]
    confidence = round(float(proba[prediction]) * 100, 1)
    verdict = labels[prediction]
    top_words = get_top_words(vectorizer, tfidf)

    response = {
        "verdict": verdict,
        "confidence": confidence,
        "label": prediction,
        "top_words": top_words,
        "mode": mode,
    }

    if include_analysis:
        response["analysis"] = analyze_article(text)
        title = generate_title(text, top_words, groq_client=groq_client)
        response["generated_title"] = title

        if verdict == "FAKE":
            framing = "Here is what verified sources are actually reporting on this topic:"
        else:
            framing = "Related sources to deepen your research on this topic:"

        response["related_articles"] = {
            "framing": framing,
            "articles": get_related_articles(title, top_words, news_client=news_client),
        }

    return response
