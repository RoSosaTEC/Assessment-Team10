"""Database schema definition and initialization."""

from db.connection import get_conn, release_conn


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    token_version INTEGER      DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS predictions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    input_text  TEXT    NOT NULL,
    verdict     VARCHAR(10) NOT NULL,
    confidence  REAL    NOT NULL,
    top_words   JSONB,
    created_at  TIMESTAMP DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_prediction ON saved_articles(prediction_id);
"""


MIGRATIONS = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER DEFAULT 0",
    "UPDATE users SET token_version = 0 WHERE token_version IS NULL",
]


def init_schema():
    """Create all tables if they don't exist."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(SCHEMA)
            for migration in MIGRATIONS:
                cur.execute(migration)
        conn.commit()
        print("Database schema initialized.")
    except Exception as exc:
        conn.rollback()
        print(f"Schema initialization error: {exc}")
        raise
    finally:
        release_conn(conn)