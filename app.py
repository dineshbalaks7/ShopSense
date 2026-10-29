
import pickle
import pandas as pd

from pathlib import Path
import pickle
import pandas as pd

from pathlib import Path
from fastapi import FastAPI, HTTPException
from Purchase import Purchase
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Online Shopping Purchase Prediction API",
    description="Predicts whether a shopping session will result in a purchase.",
    version="1.0.0",
)
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Load the trained pipeline once when the API starts
MODEL_PATH = Path("models/decision_tree_pipeline.pkl")

with MODEL_PATH.open("rb") as file:
    model = pickle.load(file)


@app.get("/")
def home():
    return {"message": "Online Shopping Purchase Prediction API is running"}


@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}



@app.post("/predict")
def predict(data: Purchase):
    try:
        visitor_data = pd.DataFrame([data.model_dump()])

        # Get prediction and probabilities
        prediction = bool(model.predict(visitor_data)[0])
        probabilities = model.predict_proba(visitor_data)[0]

        # Find the probability for the True class
        classes = list(model.classes_)
        positive_index = classes.index(True)
        purchase_probability = float(probabilities[positive_index])

        # Debug output in your terminal
        print("Model classes:", classes)
        print("Class probabilities:", probabilities)
        print("Predicted class:", prediction)

        return {
            "prediction": prediction,
            "result": (
                "Purchase likely" if prediction else "No purchase predicted"
            ),
            "purchase_probability": round(purchase_probability, 4),
            "purchase_probability_percent": round(
                purchase_probability * 100, 2
            ),
            "class_probabilities": {
                str(cls): round(float(prob), 4)
                for cls, prob in zip(classes, probabilities)
            },
        }

    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Prediction failed: {str(exc)}",
        ) from exc
