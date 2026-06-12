import re

def strip_source_prefix(text):
    """Remove Reuters and similar location prefixes that can confuse the model."""
    text = re.sub(r'^[A-Z\s,/]+\(Reuters\)\s*[-–]\s*', '', text)
    text = re.sub(r'^21st Century Wire says\s*', '', text)
    return text.strip()

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
