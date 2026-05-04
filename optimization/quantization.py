import os
import time
import numpy as np
from onnxruntime.quantization import quantize_dynamic, QuantType
import onnxruntime as ort
from transformers import AutoConfig, AutoImageProcessor
from PIL import Image
import requests

# กำหนด Path ของไฟล์
model_id = "dima806/car_models_image_detection"
onnx_model_path = "./onnx_model/model.onnx"
quantized_model_path = "./onnx_model/model_quantized.onnx"

# ---------------------------------------------------------
# 1. การทำ Dynamic Quantization (FP32 -> INT8)
# ---------------------------------------------------------
print("กำลังกระบวนการ Dynamic Quantization (FP32 -> INT8)...")
quantize_dynamic(
    model_input=onnx_model_path,
    model_output=quantized_model_path,
    weight_type=QuantType.QUInt8 # บีบอัด Weight ให้อยู่ในรูปแบบ 8-bit Integer
)
print(f"✅ บันทึกโมเดล Quantized สำเร็จที่: {quantized_model_path}")

# ---------------------------------------------------------
# 2. ทดสอบ Inference และเก็บค่า (Latency & Size)
# ---------------------------------------------------------
print("\nกำลังเตรียมรูปภาพและทดสอบ Inference...")

# โหลด Processor และ Config สำหรับดึงชื่อคลาส
processor = AutoImageProcessor.from_pretrained(model_id)
config = AutoConfig.from_pretrained(model_id)

url = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
image = Image.open(requests.get(url, stream=True).raw)

# ONNX Runtime ต้องการ Input เป็น Numpy Array ไม่ใช่ PyTorch Tensor
inputs = processor(images=image, return_tensors="np")

# โหลดโมเดลที่ผ่านการ Quantize แล้วเข้าสู่ ONNX Runtime
session = ort.InferenceSession(quantized_model_path, providers=['CPUExecutionProvider'])
input_name = session.get_inputs()[0].name

# Warmup — ให้ CPU/cache พร้อมก่อนจับเวลาจริง
N_RUNS = 20
print(f"Warmup 3 รอบ + วัด {N_RUNS} รอบ เพื่อความแม่นยำ...")
for _ in range(3):
    session.run(None, {input_name: inputs["pixel_values"]})

# วัดซ้ำ N รอบ
times = []
for _ in range(N_RUNS):
    t0 = time.perf_counter()
    outputs = session.run(None, {input_name: inputs["pixel_values"]})
    times.append((time.perf_counter() - t0) * 1000)

latency_ms = float(np.mean(times))
latency_std = float(np.std(times))

# แปลงผลลัพธ์
logits = outputs[0]
predicted_class_idx = logits.argmax(-1).item()
predicted_class = config.id2label[predicted_class_idx]

# คำนวณขนาดไฟล์ (เฉพาะไฟล์ model_quantized.onnx)
quantized_size_mb = os.path.getsize(quantized_model_path) / (1024 * 1024)

# ---------------------------------------------------------
# 3. สรุปผล
# ---------------------------------------------------------
print("\n" + "="*40)
print("ผลลัพธ์การทดสอบ Quantized ONNX Model")
print("="*40)
print(f"คำทำนาย (Prediction): {predicted_class}")
print(f"ความเร็ว (Latency): {latency_ms:.2f} ms  (±{latency_std:.2f} ms, n={N_RUNS})")
print(f"ขนาดโมเดล (Model Size): {quantized_size_mb:.2f} MB")
print("="*40)