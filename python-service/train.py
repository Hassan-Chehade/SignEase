"""
ArSL (Arabic Sign Language) landmark classifier training script.

Downloads the ArASL dataset from Kaggle, extracts MediaPipe hand landmarks
from every training image, and trains a RandomForest classifier.

Requirements:
  1. Install: pip install -r requirements.txt
  2. Place your Kaggle API credentials at D:/signease/kaggle.json
     (Get it from https://www.kaggle.com/settings → API → Create New Token)
  3. Run: python train.py

Output: arsl_model.pkl  (model + class names, saved next to this script)
"""

import os, sys, zipfile, subprocess, logging
import numpy as np
import joblib
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).parent
DATASET_DIR  = SCRIPT_DIR.parent / "datasets" / "arsl"
MODEL_OUT    = SCRIPT_DIR / "arsl_model.pkl"
TASK_FILE    = SCRIPT_DIR / "hand_landmarker.task"

KAGGLE_DATASET = "gannayasser/arabic-alphabets-sign-language-dataset-arasl"

# Map dataset folder names → Arabic Unicode characters
# Keys match the actual ArASL_Database_54K_Final folder names exactly
ARABIC_MAP = {
    "ain":   "ع", "al":    "ال","aleff": "ا", "bb":    "ب",
    "dal":   "د", "dha":   "ذ", "dhad":  "ض", "fa":    "ف",
    "gaaf":  "ق", "ghain": "غ", "ha":    "ح", "haa":   "ه",
    "jeem":  "ج", "kaaf":  "ك", "khaa":  "خ", "la":    "لا",
    "laam":  "ل", "meem":  "م", "nun":   "ن", "ra":    "ر",
    "saad":  "ص", "seen":  "س", "sheen": "ش", "ta":    "ط",
    "taa":   "ت", "thaa":  "ث", "thal":  "ظ", "toot":  "ة",
    "waw":   "و", "ya":    "ي", "yaa":   "ى", "zay":   "ز",
}

# ── MediaPipe setup ────────────────────────────────────────────────────────
def _ensure_task_file():
    if TASK_FILE.exists():
        return
    import urllib.request
    url = (
        "https://storage.googleapis.com/mediapipe-models/"
        "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
    )
    log.info("Downloading hand_landmarker.task to D: drive ...")
    TASK_FILE.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, TASK_FILE)
    log.info("hand_landmarker.task saved.")


def _build_landmarker():
    from mediapipe.tasks import python as mp_tasks
    from mediapipe.tasks.python import vision as mp_vision
    opts = mp_vision.HandLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=str(TASK_FILE)),
        running_mode=mp_vision.RunningMode.IMAGE,
        num_hands=1,
        min_hand_detection_confidence=0.3,
        min_hand_presence_confidence=0.3,
        min_tracking_confidence=0.3,
    )
    return mp_vision.HandLandmarker.create_from_options(opts)


def landmarks_to_features(hand_landmarks) -> np.ndarray:
    coords = np.array([[lm.x, lm.y, lm.z] for lm in hand_landmarks], dtype=np.float32)
    coords -= coords[0]                              # wrist at origin
    scale = np.linalg.norm(coords[9]) + 1e-9        # middle-finger MCP as scale
    coords /= scale
    return coords.flatten()                          # 63 features


# ── Dataset download ───────────────────────────────────────────────────────
def download_dataset():
    if DATASET_DIR.exists() and any(DATASET_DIR.iterdir()):
        log.info("Dataset already present at %s — skipping download.", DATASET_DIR)
        return
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    log.info("Downloading ArASL dataset from Kaggle (~300 MB) ...")
    try:
        subprocess.run(
            ["kaggle", "datasets", "download", "-d", KAGGLE_DATASET,
             "-p", str(DATASET_DIR), "--unzip"],
            check=True,
        )
        log.info("Dataset extracted to %s", DATASET_DIR)
    except subprocess.CalledProcessError as e:
        log.error(
            "Kaggle download failed.\n"
            "Make sure kaggle.json is at D:\\signease\\kaggle.json\n"
            "(Download from https://www.kaggle.com/settings → API → Create New Token)\n"
            "Error: %s", e
        )
        sys.exit(1)
    except FileNotFoundError:
        log.error(
            "kaggle CLI not found. Install it with: pip install kaggle\n"
            "Then place kaggle.json at D:\\signease\\kaggle.json"
        )
        sys.exit(1)


# ── Feature extraction ─────────────────────────────────────────────────────
def collect_features(landmarker):
    import cv2
    import mediapipe as mp
    from mediapipe.tasks.python import vision as mp_vision

    X, y = [], []
    skipped = 0

    # Find the directory that directly contains the class-named subfolders.
    # Walk into single-child wrappers up to 5 levels deep.
    def _find_class_root(start: Path) -> Path | None:
        if not start.exists():
            return None
        current = start
        for _ in range(5):
            subdirs = [d for d in current.iterdir() if d.is_dir()]
            if len(subdirs) > 1:
                return current
            elif len(subdirs) == 1:
                current = subdirs[0]
            else:
                return None
        return None

    train_root = _find_class_root(DATASET_DIR)

    if train_root is None:
        log.error("Could not find training image folders inside %s", DATASET_DIR)
        log.error("Expected a layout like: datasets/arsl/<classname>/*.jpg")
        sys.exit(1)

    log.info("Using training root: %s", train_root)

    classes = sorted([d.name for d in train_root.iterdir() if d.is_dir()])
    log.info("Found %d classes: %s", len(classes), classes)

    total_images = sum(
        len(list(d.glob("*.[jJpP][pPnN][gG]"))) +
        len(list(d.glob("*.png")))
        for d in train_root.iterdir() if d.is_dir()
    )
    processed = 0

    for cls in classes:
        cls_dir = train_root / cls
        images = list(cls_dir.glob("*.[jJpP][pPnN][gG]")) + list(cls_dir.glob("*.PNG"))
        for img_path in images:
            processed += 1
            if processed % 2000 == 0:
                log.info("  %d / %d images processed ...", processed, total_images)

            img = cv2.imread(str(img_path))
            if img is None:
                skipped += 1
                continue

            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            mp_img = mp.Image(
                image_format=mp.ImageFormat.SRGB, data=rgb
            )
            try:
                result = landmarker.detect(mp_img)
            except Exception:
                skipped += 1
                continue

            if not result.hand_landmarks:
                skipped += 1
                continue

            feats = landmarks_to_features(result.hand_landmarks[0])
            arabic_label = ARABIC_MAP.get(cls.lower(), cls)
            X.append(feats)
            y.append(arabic_label)

    log.info("Extracted %d samples, skipped %d (no hand detected).", len(X), skipped)
    return np.array(X, dtype=np.float32), np.array(y), classes


# ── Training ───────────────────────────────────────────────────────────────
def train(X, y):
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score

    log.info("Splitting into train/val (80/20) ...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    log.info("Training RandomForest (200 trees, all CPU cores) ...")
    clf = RandomForestClassifier(n_estimators=200, n_jobs=-1, random_state=42)
    clf.fit(X_train, y_train)

    val_acc = accuracy_score(y_val, clf.predict(X_val))
    log.info("Validation accuracy: %.2f%%", val_acc * 100)

    return clf


def main():
    _ensure_task_file()
    download_dataset()

    log.info("Loading MediaPipe HandLandmarker ...")
    landmarker = _build_landmarker()

    log.info("Extracting landmarks from training images ...")
    X, y, raw_classes = collect_features(landmarker)
    landmarker.close()

    if len(X) == 0:
        log.error("No samples extracted — check dataset path and MediaPipe installation.")
        sys.exit(1)

    clf = train(X, y)

    unique_labels = sorted(set(y))
    joblib.dump({"model": clf, "classes": unique_labels}, MODEL_OUT)
    log.info("Model saved to %s", MODEL_OUT)
    log.info("Done! Run the service with: uvicorn main:app --host 0.0.0.0 --port 8001")


if __name__ == "__main__":
    main()
