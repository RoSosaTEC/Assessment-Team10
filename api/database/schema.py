from database.pool import get_conn, release_conn

def init_schema():
    """Create all tables from SQL file."""
    conn = get_conn()
    try:
        with open("database/init.sql", "r") as f:
            sql = f.read()

        with conn.cursor() as cur:
            cur.execute(sql)

        conn.commit()
        print("Database schema initialized.")

    except Exception as e:
        conn.rollback()
        print(f"Schema initialization error: {e}")
        raise

    finally:
        release_conn(conn)