from services.citations import (
    build_apa_citation
)
from services.text_utils import (
    extract_relevant_excerpt
)

def get_related_articles(search_title, top_words, newsapi = None, n=3):
    """
    Search NewsAPI for articles related to search_title.
    Returns list of dicts with title, source, url, excerpt, and APA citation.
    """
    if not newsapi:
        return []

    if not search_title or not search_title.strip():
        return []

    try:
        response = newsapi.get_everything(
            q=search_title,
            language="en",
            sort_by="relevancy",
            page_size=10,
        )

        articles = response.get("articles", [])
        results  = []

        for article in articles:
            if len(results) >= n:
                break

            content = article.get("content") or article.get("description") or ""
            if not content:
                continue

            if "[Removed]" in content or not article.get("title"):
                continue

            excerpt  = extract_relevant_excerpt(content, top_words)
            citation = build_apa_citation(article)

            results.append({
                "title":        article.get("title", ""),
                "source":       article.get("source", {}).get("name", ""),
                "url":          article.get("url", ""),
                "published_at": article.get("publishedAt", "")[:10],
                "excerpt":      excerpt,
                "citation":     citation,
            })

        return results

    except Exception as e:
        print(f"NewsAPI error: {e}")
        return []
