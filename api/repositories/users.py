from database.pool import get_conn, release_conn

def get_user_by_username(username):
    conn = get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, username, password_hash, token_version 
            FROM users 
            WHERE username = %s
            """, 
            (username,))
        result = cursor.fetchone()
        cursor.close()
        return result

    finally:
        release_conn(conn)

def username_exists(username):
    conn = get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 1 
            FROM users 
            WHERE username = %s
            """, 
            (username,))
        result = cursor.fetchone()
        cursor.close()
        return bool(result)

    finally:
        release_conn(conn)

def email_exists(email):
    conn = get_conn()

    try:
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT 1
            FROM users
            WHERE email=%s
            """,
            (email,)
        )

        result = cursor.fetchone()
        cursor.close()

        return bool(result)
    finally:
        release_conn(conn)

def create_user(username, mail, password):
    conn = get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash) 
            VALUES (%s, %s, %s)
            RETURNING id
            """,
            (username, mail, password)
        )
        user_id = cursor.fetchone()[0]

        conn.commit()
        cursor.close()
        return user_id
    except:
        conn.rollback()
        raise
    finally:        
        release_conn(conn)

def increment_token_version(user_id):
    conn = get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users 
            SET token_version = token_version + 1 
            WHERE id = %s
            """,
            (user_id,)
        )
        conn.commit()
        cursor.close()
    finally:        
        release_conn(conn)