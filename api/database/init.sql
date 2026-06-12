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