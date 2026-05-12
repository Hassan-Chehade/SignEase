import base64
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from PIL import Image as PILImage
from pydantic import BaseModel
from torchvision import models, transforms

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SCRIPT_DIR   = Path(__file__).parent
TASK_FILE    = SCRIPT_DIR / "hand_landmarker.task"
CNN_MODEL    = SCRIPT_DIR / "arsl_cnn.pt"
DATASET_ROOT = Path("D:/signease/datasets/arsl")

# ── MediaPipe setup ────────────────────────────────────────────────────────
MEDIAPIPE_AVAILABLE = False
_lm_options = None

try:
    from mediapipe.tasks import python as mp_tasks
    from mediapipe.tasks.python import vision as mp_vision

    if not TASK_FILE.exists():
        import urllib.request
        url = (
            "https://storage.googleapis.com/mediapipe-models/"
            "hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
        )
        logger.info("Downloading hand_landmarker.task ...")
        urllib.request.urlretrieve(url, TASK_FILE)

    _lm_options = mp_vision.HandLandmarkerOptions(
        base_options=mp_tasks.BaseOptions(model_asset_path=str(TASK_FILE)),
        running_mode=mp_vision.RunningMode.IMAGE,
        num_hands=1,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    MEDIAPIPE_AVAILABLE = True
    logger.info("MediaPipe HandLandmarker ready.")
except Exception as e:
    logger.warning("MediaPipe unavailable (%s) — detection disabled.", e)

# ── Globals ────────────────────────────────────────────────────────────────
hand_landmarker  = None
cnn_model        = None
arabic_classes   = None   # list[str] of Arabic chars, indexed by class
class_names_raw  = None   # list[str] of folder names e.g. ['ain','aleff',...]
dataset_class_dir = None  # Path to folder containing per-class subdirs

_val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


def _find_dataset_root(base: Path):
    if not base.exists():
        return None
    current = base
    for _ in range(5):
        subdirs = [d for d in current.iterdir() if d.is_dir()]
        if len(subdirs) > 1:
            return current
        elif len(subdirs) == 1:
            current = subdirs[0]
        else:
            break
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global hand_landmarker, cnn_model, arabic_classes, class_names_raw, dataset_class_dir

    # Locate dataset
    dataset_class_dir = _find_dataset_root(DATASET_ROOT)
    if dataset_class_dir:
        logger.info("Dataset root: %s", dataset_class_dir)
    else:
        logger.warning("Dataset not found — /sign endpoint will be unavailable.")

    # Load CNN
    if not CNN_MODEL.exists():
        logger.error("arsl_cnn.pt not found — run 'python train_cnn.py' first.")
    else:
        try:
            ckpt = torch.load(str(CNN_MODEL), map_location="cpu", weights_only=False)
            n    = len(ckpt["arabic_classes"])
            m    = models.mobilenet_v2(weights=None)
            m.classifier[1] = nn.Linear(1280, n)
            m.load_state_dict(ckpt["state_dict"])
            m.eval()
            cnn_model       = m
            arabic_classes  = ckpt["arabic_classes"]
            class_names_raw = ckpt["class_names"]
            logger.info("CNN loaded (%d classes).", n)
        except Exception as e:
            logger.error("Failed to load CNN: %s", e)

    # Load MediaPipe
    if MEDIAPIPE_AVAILABLE and _lm_options:
        from mediapipe.tasks.python import vision as mp_vision
        hand_landmarker = mp_vision.HandLandmarker.create_from_options(_lm_options)
        logger.info("Hand landmarker ready.")

    logger.info("SignEase vision service ready.")
    yield

    if hand_landmarker:
        hand_landmarker.close()
    cnn_model = None


app = FastAPI(title="SignEase Vision Service", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class DetectRequest(BaseModel):
    image: str


def decode_image(data: str) -> np.ndarray:
    if data.startswith("data:"):
        data = data.split(",", 1)[1]
    raw = base64.b64decode(data)
    arr = np.frombuffer(raw, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def crop_hand(bgr: np.ndarray, landmarks) -> np.ndarray | None:
    H, W = bgr.shape[:2]
    xs  = [lm.x for lm in landmarks]
    ys  = [lm.y for lm in landmarks]
    pad = 0.18
    x1  = max(0.0, min(xs) - pad)
    y1  = max(0.0, min(ys) - pad)
    x2  = min(1.0, max(xs) + pad)
    y2  = min(1.0, max(ys) + pad)
    crop = bgr[int(y1 * H):int(y2 * H), int(x1 * W):int(x2 * W)]
    return crop if crop.size > 0 else None


@app.post("/detect")
async def detect(req: DetectRequest):
    if cnn_model is None:
        raise HTTPException(503, "Model not loaded — run python train_cnn.py first")
    if not MEDIAPIPE_AVAILABLE or hand_landmarker is None:
        raise HTTPException(503, "MediaPipe not available")

    try:
        bgr = decode_image(req.image)
    except Exception as e:
        raise HTTPException(400, f"Bad image: {e}")

    rgb    = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    try:
        result = hand_landmarker.detect(mp_img)
    except Exception as e:
        logger.warning("Landmark error: %s", e)
        return {"detected": False, "sign": None, "confidence": 0.0, "alternatives": [], "landmarks": []}

    if not result.hand_landmarks:
        return {"detected": False, "sign": None, "confidence": 0.0, "alternatives": [], "landmarks": []}

    lm_list = result.hand_landmarks[0]
    landmarks_out = [[round(lm.x, 4), round(lm.y, 4)] for lm in lm_list]

    crop = crop_hand(bgr, lm_list)
    if crop is None:
        return {"detected": False, "sign": None, "confidence": 0.0, "alternatives": [], "landmarks": landmarks_out}

    pil = PILImage.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    inp = _val_transform(pil).unsqueeze(0)

    with torch.no_grad():
        probs = torch.softmax(cnn_model(inp), dim=1)[0]

    top_vals, top_idxs = probs.topk(3)

    return {
        "detected":     True,
        "sign":         arabic_classes[top_idxs[0].item()],
        "confidence":   round(float(top_vals[0]), 4),
        "alternatives": [
            {"sign": arabic_classes[top_idxs[i].item()], "confidence": round(float(top_vals[i]), 4)}
            for i in range(1, 3)
        ],
        "landmarks": landmarks_out,
    }


@app.get("/classes")
async def get_classes():
    if arabic_classes is None:
        raise HTTPException(503, "Model not loaded")
    return {
        "classes": [
            {"name": n, "arabic": a}
            for n, a in zip(class_names_raw, arabic_classes)
        ]
    }


@app.get("/sign/{class_name}")
async def get_sign_image(class_name: str):
    if dataset_class_dir is None:
        raise HTTPException(503, "Dataset not available")
    class_dir = dataset_class_dir / class_name
    if not class_dir.exists():
        raise HTTPException(404, f"Class '{class_name}' not found")
    images = (
        list(class_dir.glob("*.jpg")) +
        list(class_dir.glob("*.JPG")) +
        list(class_dir.glob("*.jpeg")) +
        list(class_dir.glob("*.png"))
    )
    if not images:
        raise HTTPException(404, "No images found")
    img_path = images[min(8, len(images) - 1)]
    return FileResponse(str(img_path), media_type="image/jpeg")


@app.get("/health")
async def health():
    return {
        "status":       "ok",
        "model_loaded": cnn_model is not None,
        "mediapipe":    MEDIAPIPE_AVAILABLE,
        "classes":      len(arabic_classes) if arabic_classes else 0,
    }
