import pandas as pd

df = pd.read_csv("Emotional-Tone-Dataset.csv")

# FIX: remove spaces around column names
df.columns = df.columns.str.strip()

print("Columns:", df.columns)

print("\nSample rows:")
print(df.head())

# Now read the labels safely
labels = df["LABEL"]

# Count label distribution
from collections import Counter
counts = Counter(labels)

print("\nLabel counts:")
print(counts)