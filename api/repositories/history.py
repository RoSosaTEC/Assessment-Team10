from database.pool import (
    get_conn,
    release_conn
)

def get_history(user_id, limit, offset):
    conn = get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, input_text, verdict, confidence 
            FROM predictions 
            WHERE user_id = %s
            LIMIT %s 
            OFFSET %s
            """, 
            (user_id, limit, offset))
        result = cursor.fetchall()
        cursor.close()
        return result

    finally:
        release_conn(conn)