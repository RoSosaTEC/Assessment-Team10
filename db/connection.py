"""Database connection pooling only."""

import os

import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv


PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": os.getenv("DB_PORT"),
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

connection_pool = None


def init_pool():
    """Initialize the connection pool."""
    global connection_pool
    try:
        connection_pool = pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            **DB_CONFIG,
        )
        print("Database connection pool initialized.")
    except Exception as exc:
        print(f"Failed to initialize database pool: {exc}")
        raise


def get_conn():
    return connection_pool.getconn()


def release_conn(conn):
    connection_pool.putconn(conn)


def close_pool():
    if connection_pool:
        connection_pool.closeall()