"""Database query helpers for user, prediction, and saved article data."""

import json

from db.connection import get_conn, release_conn


def _json_value(value):
    if value is None:
        return None
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return value


def _format_timestamp(value):
    return value.isoformat() if hasattr(value, "isoformat") else value


def create_user(username, email, password_hash):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (username, email, password_hash)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (username, email, password_hash),
            )
            user_id = cur.fetchone()[0]
        conn.commit()
        return user_id
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def get_user_by_email(email):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, email, password_hash, token_version FROM users WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "password_hash": row[3],
                "token_version": row[4],
            }
    finally:
        release_conn(conn)


def get_user_by_username(username):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, email, password_hash, token_version FROM users WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "password_hash": row[3],
                "token_version": row[4],
            }
    finally:
        release_conn(conn)


def get_user_by_id(user_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, email, token_version FROM users WHERE id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "token_version": row[3],
            }
    finally:
        release_conn(conn)


def get_user_token_version(user_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT token_version FROM users WHERE id = %s",
                (user_id,),
            )
            row = cur.fetchone()
            if not row:
                return None
            return row[0]
    finally:
        release_conn(conn)


def increment_user_token_version(user_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE users
                SET token_version = token_version + 1
                WHERE id = %s
                """,
                (user_id,),
            )
            updated = cur.rowcount > 0
        conn.commit()
        return updated
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def log_prediction(user_id, input_text, verdict, confidence, top_words):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO predictions (user_id, input_text, verdict, confidence, top_words)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, input_text[:2000], verdict, confidence, json.dumps(top_words or [])),
            )
            prediction_id = cur.fetchone()[0]
        conn.commit()
        return prediction_id
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def get_user_predictions(user_id, limit=50, offset=0):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, input_text, verdict, confidence, top_words, created_at
                FROM predictions
                WHERE user_id = %s
                ORDER BY created_at DESC, id DESC
                LIMIT %s OFFSET %s
                """,
                (user_id, limit, offset),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": row[0],
                    "input_text": (row[1] or "")[:300],
                    "verdict": row[2],
                    "confidence": row[3],
                    "top_words": _json_value(row[4]),
                    "created_at": _format_timestamp(row[5]),
                }
                for row in rows
            ]
    finally:
        release_conn(conn)


def save_article(user_id, prediction_id, title, snippet, similarity, overlap):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO saved_articles (user_id, prediction_id, title, snippet, similarity, overlap)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (user_id, prediction_id, title, snippet, similarity, overlap),
            )
            saved_id = cur.fetchone()[0]
        conn.commit()
        return saved_id
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def get_saved_articles(user_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, prediction_id, title, snippet, similarity, overlap, saved_at
                FROM saved_articles
                WHERE user_id = %s
                ORDER BY saved_at DESC, id DESC
                """,
                (user_id,),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": row[0],
                    "prediction_id": row[1],
                    "title": row[2],
                    "snippet": row[3],
                    "similarity": row[4],
                    "overlap": row[5],
                    "saved_at": _format_timestamp(row[6]),
                }
                for row in rows
            ]
    finally:
        release_conn(conn)


def delete_saved_article(user_id, saved_article_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM saved_articles
                WHERE id = %s AND user_id = %s
                """,
                (saved_article_id, user_id),
            )
            deleted = cur.rowcount > 0
        conn.commit()
        return deleted
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def delete_prediction(user_id, prediction_id):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                DELETE FROM predictions
                WHERE id = %s AND user_id = %s
                """,
                (prediction_id, user_id),
            )
            deleted = cur.rowcount > 0
        conn.commit()
        return deleted
    except Exception:
        conn.rollback()
        raise
    finally:
        release_conn(conn)