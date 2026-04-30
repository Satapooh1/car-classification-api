# High-Throughput Image Classification API

FastAPI-based image classification service using an ONNX-quantized model (`dima806/car_models_image_detection`) deployed on Hugging Face Spaces with CI/CD via GitHub Actions.

## System Architecture

```
Client → FastAPI (async) → ThreadPoolExecutor → ONNX Runtime (Quantized INT8)
                                                        ↓
                                              Hugging Face Model Config
```

CI/CD Pipeline: `GitHub Push` → `pytest` → (if pass) → `Deploy to HF Spaces`

## Project Structure

```
├── api/
│   ├── main.py               # FastAPI application
│   ├── test_main.py          # pytest unit tests
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile            # Container definition
│   └── model_quantized.onnx  # Quantized ONNX model
├── optimization/
│   ├── inference_test.py     # Baseline (PyTorch) benchmark
│   ├── convers_onnx.py       # ONNX conversion + benchmark
│   └── quantization.py       # Dynamic quantization + benchmark
└── .github/workflows/
    └── cicd.yml              # CI/CD pipeline
```

## Model Optimization Results

| Model | Size (MB) | Latency (ms) |
|-------|-----------|--------------|
| Original (PyTorch) | ~107 | ~350 |
| ONNX | ~107 | ~120 |
| ONNX Quantized (INT8) | ~27 | ~60 |

## Running Locally with Docker

```bash
# Build image
docker build -t car-classifier ./api

# Run container
docker run -p 8000:8000 car-classifier
```

## API Usage

### Endpoint

`POST /predict`

Accepts a multipart form upload with a single image file (max 5 MB).

**Response:**
```json
{
  "filename": "car.jpg",
  "prediction": "Toyota Corolla 2018"
}
```

**Error codes:**
- `400` — not an image, corrupted file, or file > 5 MB
- `500` — model inference failure

### cURL (Cloud)

```bash
curl -X POST "https://satapooh-car-classification-api.hf.space/predict" \
  -H "accept: application/json" \
  -F "file=@/path/to/your/car.jpg"
```

### cURL (Local Docker)

```bash
curl -X POST "http://localhost:8000/predict" \
  -H "accept: application/json" \
  -F "file=@/path/to/your/car.jpg"
```

## Running Tests

```bash
cd api
pip install -r requirements.txt pytest httpx
pytest test_main.py -v
```

## CI/CD Setup

1. Add `HF_TOKEN` secret to your GitHub repository settings (Settings → Secrets → Actions → New repository secret)
2. Push to `main` branch — tests run automatically, and deploy triggers on 100% pass
