import re

def generate_title(text, top_words = None, groq_client = None):
    """
    Use Groq (Llama 3) to generate a short 5-7 word title summarizing the topic.
    Used for history labels and as the search query for NewsAPI.
    Falls back to top TF-IDF words if Groq is unavailable.
    """
    if not groq_client:
        if top_words:
            return " ".join([w["word"] for w in top_words[:4]])
        return re.sub(r'[^\w\s]', '', text[:50]).strip()

    try:
        prompt = (
            "Generate a concise 5-7 word title that captures the main topic of this news article. "
            "Return only the title, no punctuation at the end, no quotes, nothing else.\n\n"
            f"Article:\n{text[:1500]}"
        )
        response = groq_client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=20,
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"Groq error: {e}")
        if top_words:
            return " ".join([w["word"] for w in top_words[:4]])
        return re.sub(r'[^\w\s]', '', text[:50]).strip()

