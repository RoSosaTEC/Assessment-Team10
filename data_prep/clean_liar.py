import pandas as pd
import os

# LIAR Dataset cleaning Script
# Input: data/raw/train.tsv + test.tsv + valid.tsv
# Output: data/processed/liar_clean.csv

# LIAR column layout (no header row in the files):
#   0  id
#   1  label (6-class)
#   2  statement          ← our main input text
#   3  subject
#   4  speaker
#   5  speaker job title
#   6  state info
#   7  party affiliation
#   8  barely true count
#   9  false count
#  10  half true count
#  11  mostly true count
#  12  pants on fire count
#  13  context / venue

RAW_DIR  = "data/raw"
OUT_DIR  = "data/processed"
OUT_FILE = os.path.join(OUT_DIR, "liar_clean.csv")

os.makedirs(OUT_DIR, exist_ok=True)

COLUMNS = [
    "id", "label_raw", "statement", "subject",
    "speaker", "speaker_job", "state", "party",
    "barely_true_ct", "false_ct", "half_true_ct",
    "mostly_true_ct", "pants_fire_ct", "context"
]


# 1. Load all three splits

splits = {}
for split in ["train", "test", "valid"]:
    path = os.path.join(RAW_DIR, f"{split}.tsv")
    splits[split] = pd.read_csv(path, sep="\t", header=None, names=COLUMNS)
    print(f"Loaded {split:6s}  →  {len(splits[split]):,} rows")

df = pd.concat(splits.values(), ignore_index=True)
print(f"Combined     →  {len(df):,} rows\n")


# 2. Keep only the columns we need
df = df[["statement", "label_raw"]].copy()


# 3. Drop rows where statement is missing

before = len(df)
df.dropna(subset=["statement"], inplace=True)
print(f"Dropped {before - len(df)} rows with missing statement")


# 4. Map 6-class labels → binary
#  Credible  (label = 1): true, mostly-true, half-true
#  Misleading(label = 0): barely-true, false, pants-fire
#
#  The midpoint (half-true) could go either way — we assign it to credible
#  because the statement contains at least a factual core. This is a deliberate
#  design choice worth mentioning in your writeup.

LABEL_MAP = {
    "true":        1,
    "mostly-true": 1,
    "half-true":   1,
    "barely-true": 0,
    "false":       0,
    "pants-fire":  0,
}

before = len(df)
df["label"] = df["label_raw"].map(LABEL_MAP)
df.dropna(subset=["label"], inplace=True)   # drops any unexpected label values
df["label"] = df["label"].astype(int)
print(f"Dropped {before - len(df)} rows with unrecognised labels")

print("\nLabel distribution after mapping:")
for raw, binary in LABEL_MAP.items():
    count = (df["label_raw"] == raw).sum()
    print(f"  {raw:15s} → {'credible' if binary else 'misleading':12s}  {count:,}")


# 5. Light text cleaning
#  Statements are already clean short text — just strip leading/trailing spaces.

df["statement"] = df["statement"].str.strip()


# 6. Shuffle and save ───────────────────────────────────────────────────────

df = df[["statement", "label"]].sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv(OUT_FILE, index=False)

print(f"\nSaved  →  {OUT_FILE}")
print(f"Final counts  →  misleading: {(df['label'] == 0).sum():,}  |  credible: {(df['label'] == 1).sum():,}")
print(f"Class balance →  {(df['label'] == 0).mean():.1%} misleading  /  {(df['label'] == 1).mean():.1%} credible")
print(f"\nAverage statement length: {df['statement'].str.split().str.len().mean():.1f} words")
