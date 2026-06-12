import datetime

def build_apa_citation(article):
    """
    Build an APA 7th edition citation from a NewsAPI article object.
    Format: Author, A. A. (Year, Month Day). Title. Publication. URL
    If author missing, publication name moves to author position per APA guidelines.
    """
    title       = article.get("title", "Untitled").rstrip(".")
    url         = article.get("url", "")
    source_name = article.get("source", {}).get("name", "Unknown Source")

    published_at = article.get("publishedAt", "")
    try:
        dt = datetime.datetime.strptime(published_at[:10], "%Y-%m-%d")
        date_str = dt.strftime("%Y, %B %-d")
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
        citation = f"{author_str} ({date_str}). {title}. {source_name}. {url}"
    else:
        citation = f"{source_name}. ({date_str}). {title}. {url}"

    return citation
