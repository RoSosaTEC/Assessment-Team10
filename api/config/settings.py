import os
from dotenv import load_dotenv

load_dotenv()

class Settings:

    JWT_SECRET: str = os.getenv("JWT_SECRET")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    NEWS_API_KEY: str = os.getenv("NEWS_API_KEY")

    DB_HOST: str = os.getenv("DB_HOST")
    DB_PORT: int = int(os.getenv("DB_PORT", 5432))
    DB_NAME: str = os.getenv("DB_NAME")
    DB_USER: str = os.getenv("DB_USER")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD")

settings = Settings()