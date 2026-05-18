import joblib
import pandas as pd
from datetime import datetime, timedelta
import os

class DataAnalysisService:
    def __init__(self):
        models_dir = os.path.join(os.path.dirname(__file__), '../../../ml/models')
        
        # Load Prophet
        try:
            self.prophet_models = joblib.load(os.path.join(models_dir, 'prophet_models.pkl'))
        except:
            self.prophet_models = None
            
        # Load Clustering
        try:
            self.clusterer = joblib.load(os.path.join(models_dir, 'atm_clusterer.pkl'))
            self.clusters_df = pd.read_csv(os.path.join(models_dir, 'atm_clusters.csv'))
        except:
            self.clusterer = None
            self.clusters_df = None
            
        # Load Anomaly Detector
        try:
            self.anomaly_detector = joblib.load(os.path.join(models_dir, 'anomaly_detector.pkl'))
        except:
            self.anomaly_detector = None

    def get_prophet_forecast(self, atm_id: int, days_ahead: int = 7):
        if not self.prophet_models or atm_id not in self.prophet_models:
            return None
            
        model = self.prophet_models[atm_id]
        future = model.make_future_dataframe(periods=days_ahead)
        forecast = model.predict(future)
        
        # Get just the future predictions
        future_forecast = forecast.tail(days_ahead)[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
        
        results = []
        for _, row in future_forecast.iterrows():
            results.append({
                "date": row['ds'].strftime('%Y-%m-%d'),
                "predicted_demand": max(0, row['yhat']),
                "lower_bound": max(0, row['yhat_lower']),
                "upper_bound": max(0, row['yhat_upper'])
            })
            
        return results

    def get_atm_cluster(self, atm_id: int):
        if self.clusters_df is None:
            return "Unknown"
            
        cluster_info = self.clusters_df[self.clusters_df['atm_id'] == atm_id]
        if cluster_info.empty:
            return "Unknown"
            
        cluster_id = cluster_info.iloc[0]['cluster']
        # Map cluster ID to meaningful labels (assuming 3 clusters)
        labels = {0: "Low Demand", 1: "Medium Demand", 2: "High Demand"}
        return labels.get(cluster_id, f"Cluster {cluster_id}")

    def detect_anomaly(self, withdrawals: float, deposits: float, current_cash: float):
        if not self.anomaly_detector:
            return False
            
        df = pd.DataFrame([{
            'withdrawals': withdrawals,
            'deposits': deposits,
            'current_cash': current_cash
        }])
        
        # Returns -1 for anomalies, 1 for normal
        prediction = self.anomaly_detector.predict(df)[0]
        return prediction == -1

data_analysis_service = DataAnalysisService()
