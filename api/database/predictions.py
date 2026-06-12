from database.pool import get_conn, release_conn
import json

def log_prediction(user_id, input_text, verdict, confidence, top_words):
    """Insert a prediction record. Returns the new prediction id."""
    import json
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO predictions (user_id, input_text, verdict, confidence, top_words)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, input_text[:2000], verdict, confidence, json.dumps(top_words))
            )
            pred_id = cur.fetchone()[0]
        conn.commit()
        return pred_id
    except Exception as e:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def get_user_predictions(user_id, limit=50):
    """Fetch the most recent predictions for a user."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, input_text, verdict, confidence, top_words, created_at
                FROM predictions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (user_id, limit)
            )
            rows = cur.fetchall()
            return [
                {
                    "id":         r[0],
                    "input_text": r[1][:300],
                    "verdict":    r[2],
                    "confidence": r[3],
                    "top_words":  r[4],
                    "created_at": r[5].isoformat(),
                }
                for r in rows
            ]
    finally:
        release_conn(conn)
