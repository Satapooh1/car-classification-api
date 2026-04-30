import time
import os
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification
from PIL import Image
import requests

# 1. กำหนดชื่อโมเดลตามที่เลือกไว้
model_name = "dima806/car_models_image_detection"

print(f"กำลังโหลดโมเดล: {model_name}...")
# โหลด Processor สำหรับจัดการรูปภาพก่อนเข้าโมเดล และโหลดตัวโมเดล
processor = AutoImageProcessor.from_pretrained(model_name)
model = AutoModelForImageClassification.from_pretrained(model_name)

# 2. ดึงรูปภาพตัวอย่างมาทดสอบ (ในโปรเจกต์จริงสามารถเปลี่ยนเป็น path รูปในเครื่องได้)
print("กำลังเตรียมรูปภาพตัวอย่าง...")
url = "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
image = Image.open(requests.get(url, stream=True).raw)

# แปลงรูปภาพให้อยู่ในรูปแบบ Tensor (pt = PyTorch)
inputs = processor(images=image, return_tensors="pt")

# 3. ทดสอบ Inference และจับเวลาเพื่อหาค่า Latency
print("เริ่มทำการทำนายผล (Inference)...")
start_time = time.time()

# ใช้ torch.no_grad() เพื่อบอก PyTorch ว่าไม่ต้องจำการคำนวณสำหรับทำ Backpropagation ช่วยให้ทำงานเร็วขึ้นและประหยัด Memory
with torch.no_grad():
    outputs = model(**inputs)
    
end_time = time.time()
latency_ms = (end_time - start_time) * 1000 # แปลงเป็นมิลลิวินาที

# 4. แปลงผลลัพธ์เป็นชื่อคลาส
logits = outputs.logits
predicted_class_idx = logits.argmax(-1).item()
predicted_class = model.config.id2label[predicted_class_idx]

# 5. บันทึกโมเดลลง Local เพื่อวัดขนาดไฟล์ (Model Size)
save_dir = "./baseline_model"
model.save_pretrained(save_dir)
processor.save_pretrained(save_dir)

def get_dir_size(path='.'):
    total = 0
    for dirpath, dirnames, filenames in os.walk(path):
        for f in filenames:
            fp = os.path.join(dirpath, f)
            if not os.path.islink(fp):
                total += os.path.getsize(fp)
    return total

model_size_mb = get_dir_size(save_dir) / (1024 * 1024)

# 6. สรุปผลสำหรับบันทึกลงตาราง Data Collection
print("\n" + "="*40)
print("🎯 ผลลัพธ์การทดสอบ Baseline (Original Model)")
print("="*40)
print(f"🚗 คำทำนาย (Prediction): {predicted_class}")
print(f"⏱️ ความเร็ว (Latency): {latency_ms:.2f} ms")
print(f"📦 ขนาดโมเดล (Model Size): {model_size_mb:.2f} MB")
print("="*40)