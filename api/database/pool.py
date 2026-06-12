import psycopg2
from psycopg2 import pool
import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    "host":     os.getenv("DB_HOST"),
    "port":     os.getenv("DB_PORT"),
    "dbname":   os.getenv("DB_NAME"),
    "user":     os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}

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
