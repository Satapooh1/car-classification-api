import time
import sys
from pathlib import Path
import onnxruntime as ort
from transformers import AutoImageProcessor, AutoConfig
from PIL import Image

MODEL_ID = "dima806/car_models_image_detection"
ONNX_PATH = Path(__file__).parent / "api" / "model_quantized.onnx"
IMAGE_PATH = Path(__file__).parent / "test" / "car.jpeg"

print(f"โหลดโมเดล: {ONNX_PATH}")
session = ort.InferenceSession(str(ONNX_PATH), providers=["CPUExecutionProvider"])
processor = AutoImageProcessor.from_pretrained(MODEL_ID)
config = AutoConfig.from_pretrained(MODEL_ID)
print("โหลดโมเดลสำเร็จ\n")

print(f"โหลดรูป: {IMAGE_PATH}")
image = Image.open(IMAGE_PATH).convert("RGB")
inputs = processor(images=image, return_tensors="np")
input_name = session.get_inputs()[0].name

# warm-up
session.run(None, {input_name: inputs["pixel_values"]})

# inference + จับเวลา
start = time.perf_counter()
outputs = session.run(None, {input_name: inputs["pixel_values"]})
latency_ms = (time.perf_counter() - start) * 1000

predicted_idx = outputs[0].argmax(-1).item()
predicted_label = config.id2label[predicted_idx]

# top-5
import numpy as np
logits = outputs[0][0]
top5_idx = np.argsort(logits)[::-1][:5]

print("=" * 40)
print(f"ผลทำนาย: {predicted_label}")
print(f"Latency:  {latency_ms:.1f} ms")
print("=" * 40)
print("\nTop-5 predictions:")
for i, idx in enumerate(top5_idx, 1):
    score = float(np.exp(logits[idx]) / np.sum(np.exp(logits)))
    print(f"  {i}. {config.id2label[idx]} ({score*100:.1f}%)")
