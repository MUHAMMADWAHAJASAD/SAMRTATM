import joblib
import pandas as pd
from datetime import datetime
import os

class MLService:
    def __init__(self):
        # In a real scenario, models might be downloaded from Azure Blob here
        model_path = os.path.join(os.path.dirname(__file__), '../../../ml/models/cash_predictor.pkl')
        try:
            self.model = joblib.load(model_path)
        except Exception as e:
            self.model = None
            print(f"Warning: Model not found at {model_path}. ML predictions will fail until model is trained. {e}")

    def predict_demand(self, atm_id: int, target_date: datetime):
        if not self.model:
            return 5000.0 # Fallback default
        
        # Create feature array matching training: ['atm_id', 'day_of_week', 'salary_week', 'holiday', 'event_nearby']
        day_of_week = target_date.weekday()
        salary_week = 1 if 25 <= target_date.day <= 31 else 0
        holiday = 0 # Simplified
        event_nearby = 0 # Simplified
        
        features = pd.DataFrame([{
            'atm_id': atm_id,
            'day_of_week': day_of_week,
            'salary_week': salary_week,
            'holiday': holiday,
            'event_nearby': event_nearby
        }])
        
        prediction = self.model.predict(features)[0]
        return max(0.0, prediction)

    def generate_explanation(self, atm_id: int, current_cash: float, predicted_demand: float) -> str:
        """Mock LLM explanation generator"""
        if predicted_demand > current_cash:
            diff = ((predicted_demand - current_cash) / max(current_cash, 1)) * 100
            return f"ATM #{atm_id} requires a refill because predicted withdrawals ({predicted_demand:.0f}) are {diff:.0f}% higher than the current cash reserve ({current_cash:.0f})."
        elif current_cash - predicted_demand < 10000:
            return f"ATM #{atm_id} will be critically low. Predicted demand is {predicted_demand:.0f}, leaving only {current_cash - predicted_demand:.0f} remaining."
        else:
            return f"ATM #{atm_id} has sufficient funds. Predicted demand is {predicted_demand:.0f}, which is well within current capacity."

ml_service = MLService()
