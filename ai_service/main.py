from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import os
from datetime import datetime
from dotenv import load_dotenv
import joblib
from forecaster import forecaster

load_dotenv()

app = FastAPI(title="BizTrack AI Service", version="1.0.0")

# Global variables for models
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'categorizer.joblib')
categorizer_model = None

try:
    if os.path.exists(MODEL_PATH):
        categorizer_model = joblib.load(MODEL_PATH)
        print("NLP Categorizer model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with actual origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transaction(BaseModel):
    description: Optional[str] = None
    amount: float
    date: str
    vendor: Optional[str] = None

class CategorizationRequest(BaseModel):
    transactions: List[Transaction]

class ForecastRequest(BaseModel):
    business_id: str
    income_history: List[Transaction]
    expense_history: List[Transaction]
    days: int = 30

class InsightRequest(BaseModel):
    business_id: str
    expense_history: List[Transaction]

@app.get("/")
def health_check():
    return {"status": "healthy", "service": "BizTrack AI Engine", "timestamp": datetime.now().isoformat()}

@app.post("/predict/category")
async def predict_category(request: CategorizationRequest):
    """
    NLP Categorization using trained Scikit-learn model.
    """
    results = []
    
    if categorizer_model is None:
        # Fallback to heuristic logic if model isn't trained yet
        for tx in request.transactions:
            desc = tx.description.lower()
            category = "other"
            if any(w in desc for w in ["rent", "lease", "office"]): category = "rent"
            elif any(w in desc for w in ["salary", "wage", "pay", "staff"]): category = "salaries"
            elif any(w in desc for w in ["stock", "inventory", "buy", "purchase"]): category = "stock"
            elif any(w in desc for w in ["uber", "fuel", "transport", "taxi"]): category = "transport"
            elif any(w in desc for w in ["electric", "water", "bill", "power"]): category = "utilities"
            elif any(w in desc for w in ["ad", "marketing", "facebook", "google", "promo"]): category = "marketing"
            
            results.append({
                "description": tx.description,
                "suggested_category": category,
                "confidence": 0.4
            })
    else:
        # Use the ML model
        descriptions = [tx.description for tx in request.transactions]
        predictions = categorizer_model.predict(descriptions)
        # MultinomialNB doesnt always provide great probabilities without extra work, 
        # but we can try predict_proba
        try:
            probs = categorizer_model.predict_proba(descriptions)
            confidences = [float(p.max()) for p in probs]
        except:
            confidences = [0.8] * len(predictions)

        for i, tx in enumerate(request.transactions):
            results.append({
                "description": tx.description,
                "suggested_category": str(predictions[i]),
                "confidence": confidences[i]
            })
        
    return {"predictions": results}

@app.post("/predict/forecast")
async def predict_forecast(request: ForecastRequest):
    """
    Time-Series Forecasting using Facebook Prophet.
    """
    try:
        # 1. Process Income History
        income_df = pd.DataFrame([t.dict() for t in request.income_history])
        if not income_df.empty:
            income_df['date'] = pd.to_datetime(income_df['date'])
            income_df = income_df.rename(columns={'date': 'ds', 'amount': 'y'})
            income_res = forecaster.forecast(income_df, days=request.days)
        else:
            income_res = {"predictions": [], "trend_percentage": 0.0, "seasonality_mode": "none"}

        # 2. Process Expense History
        expense_df = pd.DataFrame([t.dict() for t in request.expense_history])
        if not expense_df.empty:
            expense_df['date'] = pd.to_datetime(expense_df['date'])
            expense_df = expense_df.rename(columns={'date': 'ds', 'amount': 'y'})
            expense_res = forecaster.forecast(expense_df, days=request.days)
        else:
            expense_res = {"predictions": [], "trend_percentage": 0.0, "seasonality_mode": "none"}

        return {
            "business_id": request.business_id,
            "income_forecast": income_res["predictions"],
            "income_trend": income_res["trend_percentage"],
            "expense_forecast": expense_res["predictions"],
            "expense_trend": expense_res["trend_percentage"],
            "seasonality": income_res["seasonality_mode"],
            "message": "Advanced forecast generated successfully"
        }
    except Exception as e:
        print(f"Forecasting error: {e}")
        return {"error": str(e), "message": "Failed to generate forecast"}

@app.post("/predict/insights")
async def predict_insights(request: InsightRequest):
    """
    Anomaly Detection and Optimization Tips.
    Identify categories with unusual spending spikes.
    """
    try:
        df = pd.DataFrame([t.dict() for t in request.expense_history])
        if df.empty:
            return {"insights": []}
            
        # Group by category
        category_spending = df.groupby('description')['amount'].sum().to_dict() # Simple for now
        
        # Real logic: compare last month vs average of previous 3 months
        # For simplicity in this demo, we'll flag anything over 20% of total
        total = sum(category_spending.values())
        insights = []
        
        for cat, amt in category_spending.items():
            if amt > total * 0.3: # Static threshold for demo
                insights.append({
                    "type": "anomaly",
                    "category": cat,
                    "severity": "medium",
                    "message": f"Spending in {cat} is unusually high ({(amt/total*100):.1f}% of total).",
                    "action": "Review individual receipts for potential overspending."
                })
        
        if not insights:
            insights.append({
                "type": "info",
                "message": "Your spending patterns are healthy and stable.",
                "action": "Maintain your current budget oversight."
            })
            
        return {"insights": insights}
    except Exception as e:
        return {"error": str(e), "insights": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
