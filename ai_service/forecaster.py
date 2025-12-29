import pandas as pd
from prophet import Prophet
import os
import joblib
from datetime import datetime, timedelta

class CashFlowForecaster:
    def __init__(self, model_dir='models'):
        self.model_dir = model_dir
        if not os.path.exists(self.model_dir):
            os.makedirs(self.model_dir)

    def forecast(self, historical_data: pd.DataFrame, days: int = 30):
        """
        historical_data: DataFrame with ['ds', 'y'] where 'ds' is date and 'y' is amount
        """
        # Adaptive Seasonality based on data span
        data_span_days = (historical_data['ds'].max() - historical_data['ds'].min()).days
        yearly_seasonality = data_span_days > 365
        
        # Initialize and fit Prophet model
        m = Prophet(
            daily_seasonality=False, 
            weekly_seasonality=True, 
            yearly_seasonality=yearly_seasonality
        )
        m.fit(historical_data)

        # Create future dataframe
        future = m.make_future_dataframe(periods=days)
        forecast = m.predict(future)

        # Extract projected growth trend
        # Compare last actual to last forecast
        first_yhat = forecast['yhat'].iloc[len(historical_data)]
        last_yhat = forecast['yhat'].iloc[-1]
        trend_percentage = ((last_yhat - first_yhat) / (first_yhat + 1e-6)) * 100

        # Extract the future predictions
        tail = forecast.tail(days)
        
        return {
            "predictions": tail[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records'),
            "trend_percentage": round(trend_percentage, 2),
            "seasonality_mode": "yearly" if yearly_seasonality else "weekly"
        }

    def _generate_fallback_forecast(self, days: int):
        """
        Generates a basic linear forecast if not enough data exists
        """
        start_date = datetime.now()
        forecast = []
        for i in range(1, days + 1):
            target_date = start_date + timedelta(days=i)
            forecast.append({
                "ds": target_date.strftime('%Y-%m-%d'),
                "yhat": 1000.0,
                "yhat_lower": 800.0,
                "yhat_upper": 1200.0
            })
        return {
            "predictions": forecast,
            "trend_percentage": 0.0,
            "seasonality_mode": "fallback"
        }

# Singleton instance
forecaster = CashFlowForecaster()
