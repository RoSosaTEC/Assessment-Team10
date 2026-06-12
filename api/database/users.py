from database.pool import get_conn, release_conn

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
