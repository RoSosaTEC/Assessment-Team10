from database.pool import init_pool
from database.schema import init_schema

def init_database():
    print("Initializing database...")
    init_pool()
    init_schema()
    print("Database ready.")