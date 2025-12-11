import pandas as pd

# ============================================
# ENTER YOUR MODEL RESULTS HERE
# ============================================

results = [
    {
        "model": "aubmindlab/bert-base-arabertv02",
        "dev_accuracy": 0.8814,
        "dev_f1": 0.8858,
        "test_accuracy": 0.8715,
        "test_f1": 0.8760,
    },
    {
        "model": "aubmindlab/bert-base-arabertv02-twitter",
        "dev_accuracy": 0.9011,
        "dev_f1": 0.9046,
        "test_accuracy": 0.8906,
        "test_f1": 0.8943,
    },
    {
        "model": "asafaya/bert-base-arabic",
        "dev_accuracy": 0.8740,
        "dev_f1": 0.8783,
        "test_accuracy": 0.8702,
        "test_f1": 0.8748,
    },
    {
        "model": "UBC-NLP/MARBERTv2",
        "dev_accuracy": 0.9110,
        "dev_f1": 0.9146,
        "test_accuracy": 0.9170,
        "test_f1": 0.9201,
    },
]

df = pd.DataFrame(results)
df.to_csv("model_results.csv", index=False)

print("Saved as model_results.csv")