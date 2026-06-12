"""External and metadata enrichment helpers for predictions."""

import datetime
import re

import trafilatura


def generate_title(text, top_words=None, groq_client=None):
    """Generate a short title for related-article search and history labels."""
    if not groq_client:
        if top_words:
            return " ".join([word["word"] for word in top_words[:4]])
        return re.sub(r"[^\w\s]", "", text[:50]).strip()

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
    except Exception as exc:
        print(f"Groq error: {exc}")
        if top_words:
            return " ".join([word["word"] for word in top_words[:4]])
        return re.sub(r"[^\w\s]", "", text[:50]).strip()


def build_apa_citation(article):
    """Build an APA 7th edition citation from a NewsAPI article object."""
    title = article.get("title", "Untitled").rstrip(".")
    url = article.get("url", "")
    source_name = article.get("source", {}).get("name", "Unknown Source")

    published_at = article.get("publishedAt", "")
    try:
        dt = datetime.datetime.strptime(published_at[:10], "%Y-%m-%d")
        date_str = f"{dt.year}, {dt.strftime('%B')} {dt.day}"
    except Exception:
        date_str = "n.d."

    raw_author = article.get("author", "") or ""
    if "@" in raw_author:
        raw_author = ""

    if raw_author.strip():
        parts = raw_author.strip().split()
        if len(parts) >= 2:
            author_str = f"{parts[-1]}, {parts[0][0]}."
        else:
            author_str = raw_author.strip()
        return f"{author_str} ({date_str}). {title}. {source_name}. {url}"

    return f"{source_name}. ({date_str}). {title}. {url}"


def extract_relevant_excerpt(article_text, top_words, max_length=300):
    """Find the sentence with the most overlap with the article's key words."""
    if not article_text:
        return ""

    input_words = {word["word"].lower() for word in top_words}
    sentences = re.split(r'(?<=[.!?])\s+', article_text)

    best_sentence = ""
    best_overlap = 0

    for sentence in sentences:
        sentence_lower = sentence.lower()
        overlap = sum(1 for word in input_words if word in sentence_lower)
        if overlap > best_overlap:
            best_overlap = overlap
            best_sentence = sentence

    if not best_sentence and sentences:
        best_sentence = sentences[0]

    if len(best_sentence) > max_length:
        best_sentence = best_sentence[:max_length].strip() + "..."

    return best_sentence


def get_related_articles(search_title, top_words, news_client=None, n=3):
    """Search NewsAPI for articles related to the generated title."""
    if not news_client:
        return []

    if not search_title or not search_title.strip():
        return []

    try:
        response = news_client.get_everything(
            q=search_title,
            language="en",
            sort_by="relevancy",
            page_size=10,
        )

        results = []
        for article in response.get("articles", []):
            if len(results) >= n:
                break

            content = article.get("content") or article.get("description") or ""
            if not content:
                continue
            if "[Removed]" in content or not article.get("title"):
                continue

            results.append(
                {
                    "title": article.get("title", ""),
                    "source": article.get("source", {}).get("name", ""),
                    "url": article.get("url", ""),
                    "published_at": article.get("publishedAt", "")[:10],
                    "excerpt": extract_relevant_excerpt(content, top_words),
                    "citation": build_apa_citation(article),
                }
            )

        return results
    except Exception as exc:
        print(f"NewsAPI error: {exc}")
        return []


def extract_article_text_from_url(url):
    """Fetch and extract readable article text from a URL."""
    downloaded = trafilatura.fetch_url(url)
    if not downloaded:
        return None
    return trafilatura.extract(downloaded)
