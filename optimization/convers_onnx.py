import time
import os
from transformers import AutoImageProcessor
from optimum.onnxruntime import ORTModelForImageClassification
from PIL import Image
import requests

# กำหนดชื่อโมเดลและโฟลเดอร์สำหรับเซฟ
model_id = "dima806/car_models_image_detection"
save_dir = "./onnx_model"

print("กำลังดาวน์โหลดและแปลงโมเดลเป็น ONNX Format (อาจใช้เวลาสักครู่)...")
# การใส่ export=True จะทำการแปลงจาก PyTorch เป็น ONNX ให้อัตโนมัติ
model = ORTModelForImageClassification.from_pretrained(model_id, export=True)
processor = AutoImageProcessor.from_pretrained(model_id)

# บันทึกโมเดล ONNX ลงเครื่อง
model.save_pretrained(save_dir)
processor.save_pretrained(save_dir)
print(f"บันทึกโมเดล ONNX สำเร็จที่: {save_dir}")

# --- ทดสอบ Inference ด้วย ONNX Runtime เพื่อเก็บค่า ---
print("\nกำลังเตรียมรูปภาพและทดสอบ Inference...")
url = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
image = Image.open(requests.get(url, stream=True).raw)
inputs = processor(images=image, return_tensors="pt")

# Warm-up run (เพื่อให้ระบบโหลดโมเดลเข้า Memory ให้สมบูรณ์ก่อนเริ่มจับเวลาจริง)
_ = model(**inputs)

print("เริ่มจับเวลา...")
start_time = time.time()
outputs = model(**inputs)
end_time = time.time()

latency_ms = (end_time - start_time) * 1000 # แปลงเป็นมิลลิวินาที

# แปลงผลลัพธ์กลับเป็นชื่อคลาส
logits = outputs.logits
predicted_class_idx = logits.argmax(-1).item()
predicted_class = model.config.id2label[predicted_class_idx]

# คำนวณขนาดไฟล์ (เฉพาะไฟล์ model.onnx)
onnx_file_path = os.path.join(save_dir, "model.onnx")
model_size_mb = os.path.getsize(onnx_file_path) / (1024 * 1024)

# สรุปผลสำหรับนำไปใส่ตาราง Data Collection
print("\n" + "="*40)
print("🎯 ผลลัพธ์การทดสอบ ONNX Model")
print("="*40)
print(f"🚗 คำทำนาย (Prediction): {predicted_class}")
print(f"⏱️ ความเร็ว (Latency): {latency_ms:.2f} ms")
print(f"📦 ขนาดโมเดล (Model Size): {model_size_mb:.2f} MB (เฉพาะไฟล์ .onnx)")
print("="*40)