# ShopSense — React Purchase Prediction UI

A responsive React + Vite frontend for the Online Shopping Purchase Intention Decision Tree model. It calls the existing FastAPI backend; the trained model stays in the backend.

## Requirements
- Node.js 18+ (Node.js 20+ recommended)
- Your existing FastAPI app and saved pipeline running at `http://127.0.0.1:8000`

## Run locally

1. Extract this folder (or copy it into your project workspace).
2. In a terminal inside this folder, install dependencies:

   ```bash
   npm install
   ```

3. Create `.env` by copying `.env.example` and adjust `VITE_API_URL` if your API uses another URL.
4. Start the frontend:

   ```bash
   npm run dev
   ```

5. Open the Vite URL printed in the terminal, normally `http://localhost:5173`.

## FastAPI CORS
Add this after `app = FastAPI(...)` in your `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Restart FastAPI after changing CORS. For deployment, add your real frontend domain to `allow_origins` and set `VITE_API_URL` to your deployed backend URL. Do not use `allow_origins=["*"]` with credentials in production.

## Features
- Responsive dashboard and prediction form for all 17 model features
- Sample high-engagement and low-engagement session presets
- Calls `POST /predict` with JSON and displays prediction + class probabilities
- Error handling when the API is unreachable or returns a validation error
- Model overview with production-readiness notes

## Notes
- This frontend expects the API response fields `prediction`, `result`, `purchase_probability`, and `class_probabilities`, as in the current FastAPI implementation.
- The form sends numeric fields as numbers, `Weekend` as boolean, and category values as strings.
- The Month dropdown includes values commonly present in the dataset; verify exact categories in your training data and adjust if needed.
- The session signal card is a simple UI engagement indicator, not a calibrated ML confidence score.
- A 0% or 100% tree-leaf probability is not a guarantee of real-world outcomes.
