import argparse
import pandas as pd
from datasets import Dataset
from sklearn.metrics import accuracy_score, f1_score

from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)

# -------------------------
#  Label mapping
# -------------------------
label2id = {
    "هادئ": 0,
    "سعيد": 1,
    "حزين": 2,
    "غاضب": 3,
    "متوتر": 4,
    "تعبان": 5,
}
id2label = {v: k for k, v in label2id.items()}

# -------------------------
#  CLI args
# -------------------------
parser = argparse.ArgumentParser()
parser.add_argument(
    "--model_name",
    type=str,
    required=True,
    help="HF model id, e.g. aubmindlab/bert-base-arabertv02",
)
parser.add_argument("--epochs", type=int, default=3)
parser.add_argument("--batch_size", type=int, default=8)
args = parser.parse_args()

model_name = args.model_name
print(f"Using model: {model_name}")

# -------------------------
#  Load CSVs
# -------------------------
train_df = pd.read_csv("final_train.csv")
dev_df   = pd.read_csv("final_dev.csv")
test_df  = pd.read_csv("final_test.csv")

# Make sure we have the right columns
assert "text" in train_df.columns and "label" in train_df.columns

# -------------------------
#  Map labels → ids, clean, cast to int
# -------------------------
def prepare_df(df: pd.DataFrame) -> pd.DataFrame:
    # If labels are strings (e.g. "سعيد"), map them
    if df["label"].dtype == object:
        df["label"] = df["label"].map(label2id)

    # Drop rows where label is NaN (in case of unseen labels)
    df = df.dropna(subset=["label"])

    # Force integer type so HF uses CrossEntropy (single-label)
    df["label"] = df["label"].astype(int)

    return df

train_df = prepare_df(train_df)
dev_df   = prepare_df(dev_df)
test_df  = prepare_df(test_df)

# -------------------------
#  HuggingFace Datasets
# -------------------------
train_ds = Dataset.from_pandas(train_df)
dev_ds   = Dataset.from_pandas(dev_df)
test_ds  = Dataset.from_pandas(test_df)

# -------------------------
#  Tokenizer
# -------------------------
tokenizer = AutoTokenizer.from_pretrained(model_name)

def tokenize_fn(batch):
    return tokenizer(
        batch["text"],
        padding="max_length",
        truncation=True,
        max_length=128,
    )

train_ds = train_ds.map(tokenize_fn, batched=True)
dev_ds   = dev_ds.map(tokenize_fn, batched=True)
test_ds  = test_ds.map(tokenize_fn, batched=True)

# -------------------------
#  Keep only model columns
# -------------------------
def keep_only_model_columns(ds: Dataset) -> Dataset:
    cols_to_keep = {"input_ids", "attention_mask", "token_type_ids", "label"}
    remove = [c for c in ds.column_names if c not in cols_to_keep]
    return ds.remove_columns(remove)

train_ds = keep_only_model_columns(train_ds)
dev_ds   = keep_only_model_columns(dev_ds)
test_ds  = keep_only_model_columns(test_ds)

train_ds.set_format("torch")
dev_ds.set_format("torch")
test_ds.set_format("torch")

# -------------------------
#  Model
# -------------------------
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=len(label2id),
    id2label=id2label,
    label2id=label2id,
)

# Force single-label classification so it uses CrossEntropyLoss
model.config.problem_type = "single_label_classification"

# -------------------------
#  Metrics
# -------------------------
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = logits.argmax(-1)
    acc = accuracy_score(labels, preds)
    f1_macro = f1_score(labels, preds, average="macro")
    return {"accuracy": acc, "f1_macro": f1_macro}

# -------------------------
#  TrainingArguments
# -------------------------
output_dir = f"models/{model_name.replace('/', '_')}"

training_args = TrainingArguments(
    output_dir=output_dir,
    num_train_epochs=args.epochs,
    per_device_train_batch_size=args.batch_size,
    per_device_eval_batch_size=args.batch_size,
    learning_rate=2e-5,
    weight_decay=0.01,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=dev_ds,
    compute_metrics=compute_metrics,
)
# -------------------------
#  Train
# -------------------------
trainer.train()

# 🔥 VERY IMPORTANT: save the fine-tuned model & tokenizer to disk
trainer.save_model(output_dir)
tokenizer.save_pretrained(output_dir)

print("\nModel saved to:", output_dir)

print("\n=== Dev set metrics ===")
dev_metrics = trainer.evaluate(eval_dataset=dev_ds)
print(dev_metrics)

print("\n=== Test set metrics ===")
test_metrics = trainer.evaluate(eval_dataset=test_ds)
print(test_metrics)