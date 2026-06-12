import joblib
import os

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(__file__)
    )
)

# models folder is relative to backend/
MODEL_DIR = os.path.join(BASE_DIR, "models")

ISOT_MODEL = joblib.load(
    os.path.join(MODEL_DIR, "isot_model.pkl")
)

ISOT_VECTORIZER = joblib.load(
    os.path.join(MODEL_DIR, "isot_vectorizer.pkl")
)
