"""Database package for VerifyAI."""

from db.bootstrap import initialize_backend
from db.connection import close_pool, get_conn, init_pool, release_conn
from db.queries import (
    create_user,
    delete_prediction,
    delete_saved_article,
    get_saved_articles,
    get_user_by_email,
    get_user_by_id,
    get_user_by_username,
    get_user_predictions,
    get_user_token_version,
    increment_user_token_version,
    log_prediction,
    save_article,
)
