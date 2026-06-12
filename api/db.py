"""
db.py — Database connection and schema setup
Handles PostgreSQL connection pooling and table creation.
"""

import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ── Connection config ─────────────────────────────────────────────────────────

DB_CONFIG = {
    "host":     os.getenv("DB_HOST"),
    "port":     os.getenv("DB_PORT"),
    "dbname":   os.getenv("DB_NAME"),
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

# Connection pool — reuses connections instead of opening a new one per request
# minconn=1: always keep at least 1 connection open
# maxconn=10: never open more than 10 simultaneous connections
connection_pool = None

def init_pool():
    """Initialize the connection pool. Called once at app startup."""
    global connection_pool
    try:
        connection_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            **DB_CONFIG
        )
        print("Database connection pool initialized.")
    except Exception as e:
        print(f"Failed to initialize database pool: {e}")
        raise

def get_conn():
    """Get a connection from the pool."""
    return connection_pool.getconn()

def release_conn(conn):
    """Return a connection to the pool."""
    connection_pool.putconn(conn)

def close_pool():
    """Close all connections in the pool. Called on app shutdown."""
    if connection_pool:
        connection_pool.closeall()


# ── Schema ────────────────────────────────────────────────────────────────────

SCHEMA = """

-- Users table
-- Stores registered user accounts.
-- password_hash: bcrypt hash, never store plain text passwords.
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    token_version INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
);

-- Predictions table
-- Every article analysis is logged here, linked to the user who ran it.
-- top_words: stored as JSONB so we can query inside it if needed later.
-- user_id is nullable — anonymous predictions are allowed (pre-login).
CREATE TABLE IF NOT EXISTS predictions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    input_text  TEXT    NOT NULL,
    verdict     VARCHAR(10) NOT NULL,
    confidence  REAL    NOT NULL,
    top_words   JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Saved articles table
-- Users can save any of the 5 suggested articles from a prediction.
-- prediction_id links back to the analysis that produced this suggestion.
CREATE TABLE IF NOT EXISTS saved_articles (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prediction_id INTEGER REFERENCES predictions(id) ON DELETE SET NULL,
    title         TEXT NOT NULL,
    snippet       TEXT,
    similarity    REAL,
    overlap       INTEGER,
    saved_at      TIMESTAMP DEFAULT NOW()
);

-- Index on user_id for fast history lookups
CREATE INDEX IF NOT EXISTS idx_predictions_user    ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_user          ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prediction    ON saved_articles(prediction_id);

"""

def init_schema():
    """Create all tables if they don't exist. Safe to run multiple times."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(SCHEMA)
        conn.commit()
        print("Database schema initialized.")
    except Exception as e:
        conn.rollback()
        print(f"Schema initialization error: {e}")
        raise
    finally:
        release_conn(conn)


# ── Query helpers ─────────────────────────────────────────────────────────────
# These are thin wrappers so app.py never touches raw psycopg2 directly.

def create_user(username, email, password_hash):
    """Insert a new user. Returns the new user's id."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (username, email, password_hash)
                VALUES (%s, %s, %s)
                RETURNING id
                """,
                (username, email, password_hash)
            )
            user_id = cur.fetchone()[0]
        conn.commit()
        return user_id
    except Exception as e:
        conn.rollback()
        raise
    finally:
        release_conn(conn)


def get_user_by_email(email):
    """Fetch a user row by email. Returns dict or None."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, email, password_hash FROM users WHERE email = %s",
                (email,)
            )
            row = cur.fetchone()
            if not row:
                return None
            return {"id": row[0], "username": row[1], "email": row[2], "password_hash": row[3]}
    finally:
        release_conn(conn)


def get_user_by_id(user_id):
    """Fetch a user row by id. Returns dict or None."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, username, email FROM users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return None
            return {"id": row[0], "username": row[1], "email": row[2]}
    finally:
        release_conn(conn)


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
