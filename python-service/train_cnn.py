"""
Fine-tune MobileNetV2 on the ArASL 54K dataset.
Output: arsl_cnn.pt  (saved to same directory as this script)

Run once:  python train_cnn.py
Then start the service normally.
"""

import json
import logging
import sys
from pathlib import Path

import torch
import torch.nn as nn
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, models, transforms

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger(__name__)

SCRIPT_DIR  = Path(__file__).parent
DATASET_DIR = Path("D:/signease/datasets/arsl")
MODEL_OUT   = SCRIPT_DIR / "arsl_cnn.pt"

ARABIC_MAP = {
    "ain":   "ع", "al":    "ال", "aleff": "ا",  "bb":    "ب",
    "dal":   "د", "dha":   "ذ",  "dhad":  "ض",  "fa":    "ف",
    "gaaf":  "ق", "ghain": "غ",  "ha":    "ح",  "haa":   "ه",
    "jeem":  "ج", "kaaf":  "ك",  "khaa":  "خ",  "la":    "لا",
    "laam":  "ل", "meem":  "م",  "nun":   "ن",  "ra":    "ر",
    "saad":  "ص", "seen":  "س",  "sheen": "ش",  "ta":    "ط",
    "taa":   "ت", "thaa":  "ث",  "thal":  "ظ",  "toot":  "ة",
    "waw":   "و", "ya":    "ي",  "yaa":   "ى",  "zay":   "ز",
}

BATCH_SIZE   = 32
VAL_SPLIT    = 0.15
EPOCHS_HEAD  = 3    # freeze backbone, train classifier only
EPOCHS_FULL  = 8    # unfreeze all, fine-tune end-to-end
LR_HEAD      = 1e-3
LR_FULL      = 2e-4
DEVICE       = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def find_dataset_root(base: Path) -> Path:
    current = base
    for _ in range(5):
        subdirs = [d for d in current.iterdir() if d.is_dir()]
        if len(subdirs) > 1:
            return current
        elif len(subdirs) == 1:
            current = subdirs[0]
        else:
            break
    log.error("Could not find class folders in %s", base)
    sys.exit(1)


def main():
    log.info("Device: %s", DEVICE)

    data_root = find_dataset_root(DATASET_DIR)
    log.info("Dataset root: %s", data_root)

    train_tf = transforms.Compose([
        transforms.RandomResizedCrop(224, scale=(0.65, 1.0)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(brightness=0.35, contrast=0.35, saturation=0.2, hue=0.05),
        transforms.RandomRotation(20),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    # Two ImageFolder instances pointing at same dir — different transforms
    train_ds_full = datasets.ImageFolder(str(data_root), transform=train_tf)
    val_ds_full   = datasets.ImageFolder(str(data_root), transform=val_tf)

    class_names    = train_ds_full.classes
    arabic_classes = [ARABIC_MAP.get(c.lower(), c) for c in class_names]
    log.info("Found %d classes: %s", len(class_names), class_names)

    # Stratified split so every class is represented in val
    all_idx = list(range(len(train_ds_full)))
    targets = train_ds_full.targets
    train_idx, val_idx = train_test_split(
        all_idx, test_size=VAL_SPLIT, stratify=targets, random_state=42
    )
    log.info("Train: %d  Val: %d", len(train_idx), len(val_idx))

    train_loader = DataLoader(
        Subset(train_ds_full, train_idx),
        batch_size=BATCH_SIZE, shuffle=True, num_workers=0,
    )
    val_loader = DataLoader(
        Subset(val_ds_full, val_idx),
        batch_size=BATCH_SIZE, shuffle=False, num_workers=0,
    )

    # Build model — replace final classifier with correct number of classes
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.IMAGENET1K_V1)
    model.classifier[1] = nn.Linear(1280, len(class_names))
    model = model.to(DEVICE)

    criterion = nn.CrossEntropyLoss()

    # ── Phase 1: classifier head only ──────────────────────────────────────
    for p in model.features.parameters():
        p.requires_grad = False

    optimizer = torch.optim.Adam(model.classifier.parameters(), lr=LR_HEAD)
    log.info("Phase 1: training classifier head (%d epochs) ...", EPOCHS_HEAD)

    for epoch in range(1, EPOCHS_HEAD + 1):
        _epoch(model, train_loader, criterion, optimizer, epoch, "train")
        _epoch(model, val_loader,   criterion, None,      epoch, "val")

    # ── Phase 2: full fine-tune ─────────────────────────────────────────────
    for p in model.features.parameters():
        p.requires_grad = True

    optimizer = torch.optim.Adam(model.parameters(), lr=LR_FULL)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS_FULL)

    log.info("Phase 2: fine-tuning full network (%d epochs) ...", EPOCHS_FULL)
    best_acc = 0.0

    for epoch in range(1, EPOCHS_FULL + 1):
        ep = epoch + EPOCHS_HEAD
        _epoch(model, train_loader, criterion, optimizer, ep, "train")
        val_acc = _epoch(model, val_loader, criterion, None, ep, "val")
        scheduler.step()

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(
                {
                    "state_dict":     model.state_dict(),
                    "class_names":    class_names,
                    "arabic_classes": arabic_classes,
                },
                MODEL_OUT,
            )
            log.info("  → Best so far — saved (val %.2f%%)", val_acc * 100)

    log.info("Done!  Best val accuracy: %.2f%%", best_acc * 100)
    log.info("Model saved to %s", MODEL_OUT)
    log.info("Start the service: uvicorn main:app --host 0.0.0.0 --port 8001")


def _epoch(model, loader, criterion, optimizer, epoch_num, phase):
    is_train = phase == "train"
    model.train(is_train)

    total_loss, correct, total = 0.0, 0, 0
    log_every = max(1, len(loader) // 5)

    with torch.set_grad_enabled(is_train):
        for i, (imgs, labels) in enumerate(loader, 1):
            imgs, labels = imgs.to(DEVICE), labels.to(DEVICE)
            out  = model(imgs)
            loss = criterion(out, labels)

            if is_train:
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * imgs.size(0)
            correct    += (out.argmax(1) == labels).sum().item()
            total      += imgs.size(0)

            if is_train and i % log_every == 0:
                log.info(
                    "  Epoch %d [%d/%d]  loss=%.4f  acc=%.1f%%",
                    epoch_num, i, len(loader),
                    total_loss / total, correct / total * 100,
                )

    acc = correct / total
    log.info("Epoch %d [%s]  loss=%.4f  acc=%.2f%%",
             epoch_num, phase, total_loss / total, acc * 100)
    return acc


if __name__ == "__main__":
    main()
