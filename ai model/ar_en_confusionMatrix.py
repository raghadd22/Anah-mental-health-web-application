import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# Data (same for Arabic & English)
cm = np.array([
    [240, 0,   0,   0,   0,   0],
    [0,   217, 20, 14,  5,   0],
    [0,   7,  202, 37,  5,   0],
    [0,   4,   20, 262,  3,   0],
    [0,   1,   10, 4,  227,  0],
    [0,   0,   0,  0,   0, 240]
])

arabic_labels = ["هادئ", "سعيد", "حزين", "غاضب", "متوتر", "تعبان"]
english_labels = ["Calm", "Happy", "Sad", "Angry", "Stressed", "Tired"]

plt.figure(figsize=(14, 6))

# Arabic CM
plt.subplot(1, 2, 1)
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=arabic_labels,
            yticklabels=arabic_labels)
plt.title("مصفوفة الارتباك (Arabic)")
plt.xlabel("التوقع")
plt.ylabel("الحقيقة")

# English CM
plt.subplot(1, 2, 2)
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=english_labels,
            yticklabels=english_labels)
plt.title("Confusion Matrix (English Labels)")
plt.xlabel("Predicted")
plt.ylabel("True Label")

plt.tight_layout()
plt.show()