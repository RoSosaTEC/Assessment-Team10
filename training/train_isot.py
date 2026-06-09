import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report

# ISOT — Model Training Script
# Input : data/processed/isot_clean.csv
# Output: models/isot_vectorizer.pkl
#         models/isot_model.pkl

DATA_PATH  = "data/processed/isot_clean.csv"
MODEL_DIR  = "models"

os.makedirs(MODEL_DIR, exist_ok=True)

# 1. Load data
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df):,} rows\n")

X = df["content"]
y = df["label"]


# 2. Train/test split ───────────────────────────────────────────────────────
# 80% train, 20% test, stratified so class balance is preserved in both splits

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Train size : {len(X_train):,}")
print(f"Test size  : {len(X_test):,}\n")


# 3. TF-IDF vectorization 
# max_features caps vocabulary size — 50k covers the most meaningful words while keeping memory reasonable.
# ngram_range (1,2) includes single words AND two-word pairs ("fake news", "white house") which improves accuracy on political text.

print("Fitting TF-IDF vectorizer...")
vectorizer = TfidfVectorizer(max_features=50000, ngram_range=(1, 2), sublinear_tf=True)
X_train_tfidf = vectorizer.fit_transform(X_train)
X_test_tfidf  = vectorizer.transform(X_test)
print(f"Vocabulary size: {len(vectorizer.vocabulary_):,}\n")


# 4. Train and evaluate both models 

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
    print(classification_report(y_te, preds, target_names=["Fake", "Real"]))
    return f1, model

models = {

    "Logistic Regression": LogisticRegression(max_iter=1000, C=1.0, solver="lbfgs"),
    "Random Forest":       RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
}

results = {}
for name, model in models.items():
    f1, trained_model = evaluate(name, model, X_train_tfidf, y_train, X_test_tfidf, y_test)
    results[name] = (f1, trained_model)
    print()


# 5. Test with both LR and RF, but choose LR for the final prototype due to interpretability and only marginal F1 difference
best_name = max(results, key=lambda k: results[k][0])
print(f"\nBest by F1: {best_name} (F1: {results[best_name][0]:.4f})")
print(f"Selected for deployment: Logistic Regression (interpretability + marginal F1 difference of {results[best_name][0] - results['Logistic Regression'][0]:.4f})")

chosen_model = results["Logistic Regression"][1]

joblib.dump(vectorizer, os.path.join(MODEL_DIR, "isot_vectorizer.pkl"))
joblib.dump(chosen_model, os.path.join(MODEL_DIR, "isot_model.pkl"))

print(f"\nSaved vectorizer → models/isot_vectorizer.pkl")
print(f"Saved model      → models/isot_model.pkl  (Logistic Regression)")
