import io
from fastapi.testclient import TestClient
from PIL import Image
from unittest.mock import patch
from main import app

client = TestClient(app)

def generate_dummy_image():
    """ฟังก์ชันสร้างรูปภาพสีแดงจำลอง เพื่อใช้ทดสอบ API โดยไม่ต้องโหลดไฟล์จริง"""
    img = Image.new('RGB', (224, 224), color='red')
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    return img_byte_arr.getvalue()

@patch("main.run_inference")
def test_predict_endpoint_success(mock_run_inference):
    """ทดสอบว่า API Endpoint /predict ทำงานได้และตอบกลับเป็น JSON ที่ถูกต้อง (โดยการ Mock ผลลัพธ์โมเดล)"""
    # จำลองผลลัพธ์ว่าโมเดลทำนายได้อะไร เพื่อให้ผ่านโดยไม่ต้องโหลดไฟล์ ONNX จริงๆ
    mock_run_inference.return_value = {"prediction": "Toyota Camry"}

    img_bytes = generate_dummy_image()
    files = {"file": ("test_image.jpg", img_bytes, "image/jpeg")}
    
    response = client.post("/predict", files=files)
    
    # เช็คว่า HTTP Status Code เป็น 200 OK
    assert response.status_code == 200
    
    data = response.json()
    # เช็คว่าโครงสร้าง JSON ตอบกลับถูกต้องตาม Pydantic Model
    assert "filename" in data
    assert "prediction" in data
    assert data["filename"] == "test_image.jpg"
    assert data["prediction"] == "Toyota Camry"

def test_predict_endpoint_invalid_file():
    """ทดสอบ Error Handling ดักจับ Error กรณีไฟล์ไม่ใช่รูปภาพ"""
    # จำลองการส่งไฟล์ Text ธรรมดา
    files = {"file": ("document.txt", b"This is a dummy text file", "text/plain")}
    
    response = client.post("/predict", files=files)
    
    # เช็คว่า API ตอบกลับเป็น 400 Bad Request ตามที่เขียนดักไว้
    assert response.status_code == 400
    assert "detail" in response.json()
    assert response.json()["detail"] == "Invalid file type. Please upload an image."

def test_predict_endpoint_corrupted_file():
    """ทดสอบ Error Handling กรณีไฟล์เสีย (Corrupted)"""
    # จำลองการส่งไฟล์ที่อ้างว่าเป็น jpeg แต่ไส้ในเป็นแค่ string มั่วๆ
    files = {"file": ("broken.jpg", b"not an image data", "image/jpeg")}
    
    response = client.post("/predict", files=files)
    
    assert response.status_code == 400