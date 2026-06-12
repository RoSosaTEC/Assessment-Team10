def save_article(user_id, prediction_id, title, snippet, similarity, overlap):
    """Save a suggested article for a user. Returns the new saved_article id."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO saved_articles (user_id, prediction_id, title, snippet, similarity, overlap)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, prediction_id, title, snippet, similarity, overlap)
            )
            saved_id = cur.fetchone()[0]
        conn.commit()
        return saved_id
    except Exception as e:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def get_saved_articles(user_id):
    """Fetch all saved articles for a user, newest first."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, prediction_id, title, snippet, similarity, overlap, saved_at
                FROM saved_articles
                WHERE user_id = %s
                ORDER BY saved_at DESC
                """,
                (user_id,)
            )
            rows = cur.fetchall()
            return [
                {
                    "id":            r[0],
                    "prediction_id": r[1],
                    "title":         r[2],
                    "snippet":       r[3],
                    "similarity":    r[4],
                    "overlap":       r[5],
                    "saved_at":      r[6].isoformat(),
                }
                for r in rows
            ]
    finally:
        release_conn(conn)


def delete_saved_article(user_id, saved_article_id):
    """
    Delete a saved article. user_id check ensures users can only
    delete their own saved articles.
    Returns True if a row was deleted, False if not found.
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM saved_articles
                WHERE id = %s AND user_id = %s
                """,
                (saved_article_id, user_id)
            )
            deleted = cur.rowcount > 0
        conn.commit()
        return deleted
    except Exception as e:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def delete_prediction(user_id, prediction_id):
    """
    Delete a prediction and its associated saved articles.
    user_id check ensures users can only delete their own predictions.
    Returns True if a row was deleted, False if not found.
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM predictions
                WHERE id = %s AND user_id = %s
                """,
                (prediction_id, user_id)
            )
            deleted = cur.rowcount > 0
        conn.commit()
        return deleted
    except Exception as e:
        conn.rollback()
        raise
    finally:
        release_conn(conn)
