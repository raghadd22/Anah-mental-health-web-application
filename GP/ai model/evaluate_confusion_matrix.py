import pandas as pd
from datasets import Dataset
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns
import matplotlib.pyplot as plt

from transformers import AutoTokenizer, AutoModelForSequenceClassification

# -------------------------------------------------
# Label mapping
# -------------------------------------------------
label2id = {
    "ok": 0,
    "happy": 1,
    "sad": 2,
    "angry": 3,
    "worried": 4,
    "tired": 5,
}
id2label = {v: k for k, v in label2id.items()}

# -------------------------------------------------
# Load data
# -------------------------------------------------
test_df = pd.read_csv("final_test.csv")

# Convert labels to IDs if needed
if test_df["label"].dtype == object:
    test_df["label"] = test_df["label"].map(label2id)

test_df = test_df.dropna(subset=["label"])
test_ds = Dataset.from_pandas(test_df)

# -------------------------------------------------
# Load tokenizer & model (best MARBERTv2 checkpoint)
# -------------------------------------------------
model_path = "models/UBC-NLP_MARBERTv2"  # CHANGE if needed

tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

# -------------------------------------------------
# Tokenize test text
# -------------------------------------------------
def tokenize_fn(batch):
    return tokenizer(batch["text"], truncation=True, padding="max_length", max_length=128)

test_ds = test_ds.map(tokenize_fn, batched=True)
test_ds = test_ds.remove_columns(["text", "__index_level_0__"]) if "__index_level_0__" in test_ds.column_names else test_ds
test_ds.set_format("torch")

# -------------------------------------------------
# Run predictions
# -------------------------------------------------
import torch

preds = []
labels = []

model.eval()
with torch.no_grad():
    for batch in test_ds:
        input_ids = batch["input_ids"].unsqueeze(0)
        attention_mask = batch["attention_mask"].unsqueeze(0)
        label = batch["label"]

        logits = model(input_ids=input_ids, attention_mask=attention_mask).logits
        pred = torch.argmax(logits, dim=-1).item()

        preds.append(pred)
        labels.append(label)

# -------------------------------------------------
# Confusion matrix
# -------------------------------------------------
cm = confusion_matrix(labels, preds)
print("Confusion Matrix:\n", cm)

plt.figure(figsize=(8, 6))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=[id2label[i] for i in range(6)],
    yticklabels=[id2label[i] for i in range(6)],
)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("MARBERTv2 Confusion Matrix")
plt.savefig("marbertv2_confusion_matrix.png")
plt.show()

# -------------------------------------------------
# Detailed per-class report
# -------------------------------------------------
print("\nClassification Report:")
print(classification_report(labels, preds, target_names=[id2label[i] for i in range(6)]))