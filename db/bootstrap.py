"""Backend bootstrap helpers."""

from db.connection import init_pool
from db.schema import init_schema


def initialize_backend():
    """Initialize the database pool and schema."""
    init_pool()
    init_schema()