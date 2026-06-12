import json

def get_top_words(
    vectorizer,
    tfidf_vector,
    n = 5
):
    feature_names = (
        vectorizer.get_feature_names_out()
    )

    scores = (
        tfidf_vector.toarray()[0]
    )

    top_indices = (
        scores.argsort()[::-1][:n]
    )

    return [{
        "word": feature_names[i],
        "score": round(float(scores[i]),4)
    }
    for i in top_indices
    
    if scores[i] > 0
    ]

def predict_and_respond(
    text, model, vectorizer, mode, labels, run_dashboard, strip_source_prefix, 
    analyze_article, generate_title, get_related_articles, log_prediction, user_id=None,):
    
    text = strip_source_prefix(text)

    tfidf = (
        vectorizer.transform([text])
    )

    prediction = int(
        model.predict(tfidf)[0]
    )

    proba = (
        model.predict_proba(tfidf)[0]
    )

    confidence = round(float(proba[prediction])*100,1)

    verdict = (labels[prediction])

    top_words = (
        get_top_words(vectorizer, tfidf)
    )
    
    user_id = user_id

    log_prediction(user_id, text, verdict, confidence, top_words)

    response = {
        "verdict": verdict,
        "confidence": confidence,
        "label": prediction, 
        "top_words": top_words,
        "mode": mode,
    }

    if run_dashboard:
        response["analysis"] = (
            analyze_article(text)
        )

        title = (
            generate_title(
                text, top_words
            )
        )

        response["generated_title"] = title

        related = (
            get_related_articles(
                title, top_words
            )
        )

        response["related_articles"] = {
            "framing": ("Here's what verified sources are actually reporting on this topic:"
            if verdict == "FAKE"
            else
            "Related sources to deepen your research on this topic:"),
            "articles": related,
        }

    return response