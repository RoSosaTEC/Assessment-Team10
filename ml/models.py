"""Model loading and exported model/vectorizer instances."""

import os

import joblib


BASE_DIR = os.path.dirname(__file__)
MODEL_DIR = os.path.join(BASE_DIR, "..", "models")

ISOT_MODEL_PATH = os.path.join(MODEL_DIR, "isot_model.pkl")
ISOT_VEC_PATH = os.path.join(MODEL_DIR, "isot_vectorizer.pkl")
LIAR_MODEL_PATH = os.path.join(MODEL_DIR, "liar_model.pkl")
LIAR_VEC_PATH = os.path.join(MODEL_DIR, "liar_vectorizer.pkl")


def _load_model(path):
    return joblib.load(path)


print("Loading models...")
isot_model = _load_model(ISOT_MODEL_PATH)
isot_vectorizer = _load_model(ISOT_VEC_PATH)
liar_model = _load_model(LIAR_MODEL_PATH)
liar_vectorizer = _load_model(LIAR_VEC_PATH)
print("Models loaded.")
