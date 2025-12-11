import pandas as pd
import random
from collections import Counter
from sklearn.model_selection import train_test_split

# -----------------------------
# 0) Config
# -----------------------------
BASE_CSV = "Emotional-Tone-Dataset.csv"
CALM_TARGET = 1200
TIRED_TARGET = 1200
RANDOM_SEED = 42
random.seed(RANDOM_SEED)

# -----------------------------
# 1) Load base dataset
# -----------------------------
print("Loading Emotional-Tone dataset...")
df = pd.read_csv(BASE_CSV)

# Clean column names just in case
df.columns = [c.strip() for c in df.columns]
print("Columns:", df.columns)

# Keep only needed columns
df = df[["TWEET", "LABEL"]].dropna()

# Keep only the labels we use
label_map = {
    "joy": "سعيد",
    "sadness": "حزين",
    "anger": "غاضب",
    "fear": "متوتر",
    "surprise": "متفاجئ",
}

df = df[df["LABEL"].isin(label_map.keys())].copy()
df["label"] = df["LABEL"].map(label_map)
df = df.rename(columns={"TWEET": "text"})

print("\nBase label counts (after filtering):")
print(Counter(df["label"]))

# -----------------------------
# 2) Synthetic sentence generators
# -----------------------------
def generate_sentences(n, base_list, prefixes, feelings, tails):
    """
    Generates ~n sentences mixing:
      - fixed base sentences
      - combinations of prefix + feeling + tail
    """
    sentences = []

    # First, use all base_list (they're good quality hand-written)
    for s in base_list:
        sentences.append(s)
        if len(sentences) >= n:
            return sentences

    # Then generate combinations until we reach n
    while len(sentences) < n:
        s = f"{random.choice(prefixes)} {random.choice(feelings)} {random.choice(tails)}"
        sentences.append(s)

    return sentences[:n]


# ---------- Calm (هادئ) ----------
CALM_BASE = [
    "اليوم كان هادئ جدًا والحمدلله.",
    "حسّيت أن يومي رايق وبسيط.",
    "مزاجي كان مستقر وهادئ أغلب اليوم.",
    "اليوم عدى بهدوء بدون أي توتر.",
    "كنت مرتاحة نفسيًا طول اليوم تقريبًا.",
    "كل شيء كان ماشي بسلاسة وبدون ضغوط.",
    "شعوري اليوم أقرب للراحة والهدوء.",
    "كان يوم خفيف على القلب.",
    "ما كان في شيء يسبب إزعاج اليوم.",
    "استمتعت بهدوء اليوم وبساطته.",
]

CALM_PREFIXES = [
    "اليوم",
    "صباحي",
    "مسائي",
    "هاليومين",
    "جو البيت",
    "وقتي الحالي",
    "مزاجي اليوم",
    "حاليًا",
]

CALM_FEELINGS = [
    "كان هادئ ومرتاح",
    "كان رايق بدون إزعاج",
    "كان بسيط وبدون ضغوط",
    "ما فيه توتر أو قلق",
    "فيه سلام داخلي",
    "مرتاح نفسيًا",
    "أقرب للسكينة",
    "مليان هدوء",
]

CALM_TAILS = [
    "والحمدلله على هالنعمة.",
    "وحسّيت أني أتنفس براحة.",
    "بدون أي دراما أو مشاكل.",
    "وحسّيت أن قلبي مطمّن.",
    "وكأن كل شيء في مكانه الصحيح.",
    "وهذا النوع من الأيام يعجبني.",
    "وما كان في شيء يضايقني.",
    "وأتمنى تبقى هالفترة بهذا الهدوء.",
]

calm_sentences = generate_sentences(
    CALM_TARGET,
    CALM_BASE,
    CALM_PREFIXES,
    CALM_FEELINGS,
    CALM_TAILS,
)

df_calm = pd.DataFrame({
    "text": calm_sentences,
    "label": ["هادئ"] * len(calm_sentences),
    "source": ["synthetic_calm"] * len(calm_sentences),
})

# ---------- Tired (تعبان) ----------
TIRED_BASE = [
    "اليوم كنت تعبان بشكل واضح.",
    "حسّيت أن طاقتي منخفضة طول اليوم.",
    "ذهنيًا وجسديًا حاس إنّي مرهق.",
    "اليوم كان متعب أكثر من المعتاد.",
    "ما كان عندي طاقة أسوي أشياء كثيرة.",
    "كنت أجرّ نفسي عشان أخلص مهامي.",
    "حسّيت أني محتاج راحة طويلة.",
    "كل شيء بسيط كان يستهلك مني مجهود.",
    "تركيزي ضعيف بسبب التعب.",
    "حاس إن جسمي وعقلي يبغون إجازة.",
]

TIRED_PREFIXES = [
    "اليوم",
    "من الصباح",
    "من بدري",
    "من كثر التفكير",
    "بسبب الضغط",
    "بعد يوم طويل",
    "اليوم كامل",
    "خلال اليوم",
]

TIRED_FEELINGS = [
    "حاس إني تعبان جدًا",
    "طاقتي كانت شبه منتهية",
    "ما عندي طاقة حتى للأشياء البسيطة",
    "مرهق جسديًا ونفسيًا",
    "أشعر بإجهاد من كل شيء",
    "أحس أني مستنزف بالكامل",
    "مليان تعب داخلي",
    "أحس أن جسمي ثقيل",
]

TIRED_TAILS = [
    "وأحتاج أرتاح شوي.",
    "وودي أختفي عن كل شيء اليوم.",
    "وأفكر آخذ وقت لنفسي.",
    "ومو قادر أركز على أي شيء.",
    "وحاس أن النوم هو الحل الآن.",
    "وأحس أني مستهلك من كثر الإلتزامات.",
    "وأتمنى ألقى وقت أريح فيه بالي.",
    "وأحتاج أوقف كل شيء بس عشان أتنفس.",
]

tired_sentences = generate_sentences(
    TIRED_TARGET,
    TIRED_BASE,
    TIRED_PREFIXES,
    TIRED_FEELINGS,
    TIRED_TAILS,
)

df_tired = pd.DataFrame({
    "text": tired_sentences,
    "label": ["تعبان"] * len(tired_sentences),
    "source": ["synthetic_tired"] * len(tired_sentences),
})

print(f"\nGenerated calm: {len(df_calm)} rows")
print(f"Generated tired: {len(df_tired)} rows")

# -----------------------------
# 3) Merge everything
# -----------------------------
df_base_final = df[["text", "label"]].copy()
df_base_final["source"] = "emotional_tone"

all_df = pd.concat([df_base_final, df_calm, df_tired], ignore_index=True)

print("\nFinal label counts (before split):")
print(Counter(all_df["label"]))

# -----------------------------
# 4) Train / Dev / Test split
#    - Test 20% of total
#    - Train/Dev: 80% of total → inside it: 80% train, 20% dev
# -----------------------------
train_dev, test = train_test_split(
    all_df,
    test_size=0.20,
    random_state=RANDOM_SEED,
    stratify=all_df["label"],
)

train, dev = train_test_split(
    train_dev,
    test_size=0.20,  # 20% of (train+dev) → 16% of total
    random_state=RANDOM_SEED,
    stratify=train_dev["label"],
)

print("\nSplit sizes:")
print("Train:", len(train))
print("Dev:  ", len(dev))
print("Test: ", len(test))

print("\nLabel counts in train:")
print(Counter(train["label"]))
print("\nLabel counts in dev:")
print(Counter(dev["label"]))
print("\nLabel counts in test:")
print(Counter(test["label"]))

# -----------------------------
# 5) Save to CSV
# -----------------------------
train.to_csv("final_train.csv", index=False)
dev.to_csv("final_dev.csv", index=False)
test.to_csv("final_test.csv", index=False)

print("\nSaved: final_train.csv, final_dev.csv, final_test.csv")