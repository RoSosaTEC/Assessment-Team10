import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# ─────────────────────────────────────────────
# LIAR — Model Training Script
# Input : data/processed/liar_clean.csv
# Output: models/liar_vectorizer.pkl
#         models/liar_model.pkl
# ─────────────────────────────────────────────

DATA_PATH  = "data/processed/liar_clean.csv"
MODEL_DIR  = "models"

os.makedirs(MODEL_DIR, exist_ok=True)

# ── 1. Load data ──────────────────────────────────────────────────────────────

df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df):,} rows\n")

X = df["statement"]
y = df["label"]


# ── 2. Train/test split ───────────────────────────────────────────────────────

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Train size : {len(X_train):,}")
print(f"Test size  : {len(X_test):,}\n")


# ── 3. TF-IDF vectorization ───────────────────────────────────────────────────
# Smaller vocabulary than ISOT — short statements have a much smaller
# unique word space. (1,2) ngrams still help catch political phrases.

print("Fitting TF-IDF vectorizer...")
vectorizer = TfidfVectorizer(max_features=10000, ngram_range=(1, 2), sublinear_tf=True)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf  = vectorizer.transform(X_test)
print(f"Vocabulary size: {len(vectorizer.vocabulary_):,}\n")


# ── 4. Train and evaluate both models ────────────────────────────────────────

def evaluate(name, model, X_tr, y_tr, X_te, y_te):
    print(f"Training {name}...")
    model.fit(X_tr, y_tr)
    preds = model.predict(X_te)
    acc  = accuracy_score(y_te, preds)
    prec = precision_score(y_te, preds)
    rec  = recall_score(y_te, preds)
    f1   = f1_score(y_te, preds)
    print(f"  Accuracy : {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall   : {rec:.4f}")
    print(f"  F1 Score : {f1:.4f}")
    print(classification_report(y_te, preds, target_names=["Misleading", "Credible"]))
    return f1, model

models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, C=1.0, solver="lbfgs", class_weight="balanced"),
    "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1, class_weight="balanced"),
}

results = {}
for name, model in models.items():
    f1, trained_model = evaluate(name, model, X_train_tfidf, y_train, X_test_tfidf, y_test)
    results[name] = (f1, trained_model)
    print()


# ── 5. Pick the best model and save ──────────────────────────────────────────

best_name = max(results, key=lambda k: results[k][0])
best_model = results[best_name][1]

print(f"Best model: {best_name} (F1: {results[best_name][0]:.4f})")

import numpy as np
from sklearn.calibration import CalibratedClassifierCV

# Find the threshold that balances precision/recall for misleading class
probs = best_model.predict_proba(X_test_tfidf)[:, 0]  # prob of misleading
thresholds = np.arange(0.3, 0.7, 0.02)
best_thresh, best_f1 = 0.5, 0

for t in thresholds:
    preds = (probs >= t).astype(int)
    preds = 1 - preds  # flip back to label space
    f1 = f1_score(y_test, preds)
    misleading_recall = recall_score(y_test, preds, pos_label=0)
    print(f"Threshold {t:.2f} → F1: {f1:.4f} | Misleading recall: {misleading_recall:.4f}")
    if f1 > best_f1:
        best_f1 = f1
        best_thresh = t

print(f"\nBest threshold: {best_thresh:.2f}")
joblib.dump(best_thresh, os.path.join(MODEL_DIR, "liar_threshold.pkl"))

joblib.dump(vectorizer, os.path.join(MODEL_DIR, "liar_vectorizer.pkl"))
joblib.dump(best_model, os.path.join(MODEL_DIR, "liar_model.pkl"))

print(f"\nSaved vectorizer → models/liar_vectorizer.pkl")
print(f"Saved model      → models/liar_model.pkl  ({best_name})")
