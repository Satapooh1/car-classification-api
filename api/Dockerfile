# ใช้ Python แบบ slim เพื่อให้ Image มีขนาดเล็กลง 
FROM python:3.10-slim

# ตั้งค่า Directory ทำงานใน Container
WORKDIR /app

# คัดลอกไฟล์ requirements.txt และติดตั้งไลบรารีแบบไม่เก็บ Cache 
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# คัดลอกโค้ด API และ ไฟล์โมเดล ONNX 
# (ห้ามก็อปโฟลเดอร์โมเดล PyTorch อันเก่ามาเด็ดขาด เพื่อประหยัดพื้นที่) 
COPY main.py .
COPY model_quantized.onnx .
COPY config.json .
COPY preprocessor_config.json .

# เปิด Port 8000
EXPOSE 8000

# รัน FastAPI ผ่าน Uvicorn 
# หมายเหตุ: ใช้ --workers 1 เพราะเรามี ProcessPoolExecutor จัดการ Concurrency อยู่ในโค้ดแล้ว
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]