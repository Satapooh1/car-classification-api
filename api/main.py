import asyncio
import io
import json
from concurrent.futures import ProcessPoolExecutor
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from PIL import Image, UnidentifiedImageError
import numpy as np
import onnxruntime as ort

QUANTIZED_MODEL_PATH = "model_quantized.onnx"
CONFIG_PATH = "config.json"

# Per-process globals — loaded once per worker by _init_worker, not shared across processes
_worker_session = None
_worker_id2label = None

def _init_worker():
    global _worker_session, _worker_id2label
    _worker_session = ort.InferenceSession(
        QUANTIZED_MODEL_PATH, providers=["CPUExecutionProvider"]
    )
    with open(CONFIG_PATH) as f:
        cfg = json.load(f)
    _worker_id2label = {int(k): v for k, v in cfg["id2label"].items()}

executor = None

@asynccontextmanager
async def lifespan(_: FastAPI):
    global executor
    executor = ProcessPoolExecutor(max_workers=4, initializer=_init_worker)
    yield
    executor.shutdown(wait=False)

app = FastAPI(title="Car Models Classification API", lifespan=lifespan)

# Reject requests beyond this queue depth instead of silently timing out
MAX_CONCURRENT_REQUESTS = 50
_semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

def preprocess(image: Image.Image) -> np.ndarray:
    """Resize → rescale (÷255) → normalize (mean=std=0.5) → CHW → batch"""
    image = image.resize((224, 224), Image.BICUBIC)
    arr = np.array(image, dtype=np.float32) / 255.0
    arr = (arr - 0.5) / 0.5
    arr = arr.transpose(2, 0, 1)[np.newaxis]  # (1, 3, 224, 224)
    return arr

def run_inference(image_bytes: bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        pixel_values = preprocess(image)
        input_name = _worker_session.get_inputs()[0].name
        outputs = _worker_session.run(None, {input_name: pixel_values})
        predicted_idx = int(outputs[0].argmax(-1))
        return {"prediction": _worker_id2label[predicted_idx]}
    except Exception as e:
        return {"error": str(e)}

class PredictionResponse(BaseModel):
    filename: str = Field(..., description="ชื่อไฟล์ที่อัปโหลด")
    prediction: str = Field(..., description="ผลการทำนายรถยนต์")

@app.post("/predict", response_model=PredictionResponse)
async def predict_image(file: UploadFile = File(...)):
    MAX_FILE_SIZE = 5 * 1024 * 1024

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")

    try:
        Image.open(io.BytesIO(image_bytes)).verify()
    except UnidentifiedImageError:
        raise HTTPException(status_code=400, detail="File is corrupted or not a valid image format.")

    try:
        await asyncio.wait_for(_semaphore.acquire(), timeout=3.0)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=503, detail="Server is overloaded. Please try again later.")

    try:
        loop = asyncio.get_running_loop()
        result = await loop.run_in_executor(executor, run_inference, image_bytes)
    finally:
        _semaphore.release()

    if "error" in result:
        raise HTTPException(status_code=500, detail=f"Model Inference Failed: {result['error']}")

    return PredictionResponse(filename=file.filename, prediction=result["prediction"])
