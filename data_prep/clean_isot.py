import pandas as pd
import re
import os

# ISOT Fake News Dataset cleaning Script
# Input: data/raw/Fake.csv + data/raw/True.csv
# Output: data/processed/isot_clean.csv

RAW_DIR  = "data/raw"
OUT_DIR  = "data/processed"
OUT_FILE = os.path.join(OUT_DIR, "isot_clean.csv")

os.makedirs(OUT_DIR, exist_ok=True)

# 1. Load both files and attach labels

fake = pd.read_csv(os.path.join(RAW_DIR, "Fake.csv"))
real = pd.read_csv(os.path.join(RAW_DIR, "True.csv"))

fake["label"] = 0   # 0 = fake
real["label"] = 1   # 1 = real

df = pd.concat([fake, real], ignore_index=True)

print(f"Loaded  →  {len(fake):,} fake  |  {len(real):,} real  |  {len(df):,} total")


# 2. Keep only the columns we need

df = df[["title", "text", "label"]].copy()


# 3. Drop rows where title or text is missing

before = len(df)
df.dropna(subset=["title", "text"], inplace=True)
print(f"Dropped {before - len(df):,} rows with missing title/text")


# 4. Strip "crawler artefacts"
# Real articles: all start with "CITY (Reuters) -" or "CITY (Reuters) –"
# Leaving this in lets the model cheat by recognising the source tag

# Fake articles: 733 rows start with "21st Century Wire says"
# Same problem, the model would learn the source, not the content

reuters_pattern = r"^[A-Z\s,]+\(Reuters\)\s*[-–]\s*"
wire_pattern    = r"^21st Century Wire says\s*"

df["text"] = df["text"].str.replace(reuters_pattern, "", regex=True)
df["text"] = df["text"].str.replace(wire_pattern,    "", regex=True)

print("Stripped Reuters and 21st Century Wire prefixes")

# 5. Drop rows where text is very short after stripping
# A handful of rows are just a URL or a two-word abbreviation after stripping

before = len(df)
df = df[df["text"].str.split().str.len() >= 20]
print(f"Dropped {before - len(df):,} rows with fewer than 20 words after stripping")


# 6. Combine title + text into a single input field
# Feeding both gives the model slightly more signal than text alone

df["content"] = df["title"].str.strip() + " " + df["text"].str.strip()


# 7. Shuffle and save

df = df[["content", "label"]].sample(frac=1, random_state=42).reset_index(drop=True)
df.to_csv(OUT_FILE, index=False)

print(f"\nSaved  →  {OUT_FILE}")
print(f"Final counts  →  fake: {(df['label'] == 0).sum():,}  |  real: {(df['label'] == 1).sum():,}")
print(f"Class balance →  {(df['label'] == 0).mean():.1%} fake  /  {(df['label'] == 1).mean():.1%} real")
