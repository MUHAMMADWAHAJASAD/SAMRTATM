import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.cluster import KMeans
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from prophet import Prophet
import joblib
import os

# Create model directory if it doesn't exist
os.makedirs('../models', exist_ok=True)

def generate_dataset(num_rows=10000):
    np.random.seed(42)
    print("Generating simulated ATM dataset...")
    
    # Simulate data for 10 different ATMs
    atm_ids = np.random.randint(1, 11, size=num_rows)
    dates = pd.date_range(start='2023-01-01', periods=num_rows, freq='H')
    
    data = []
    for i in range(num_rows):
        atm_id = atm_ids[i]
        date = dates[i]
        
        # Base withdrawals on time of day
        hour = date.hour
        base_withdrawal = np.random.normal(500, 100) if 8 <= hour <= 20 else np.random.normal(100, 30)
        
        day_of_week = date.weekday() # 0-6
        salary_week = 1 if 25 <= date.day <= 31 else 0
        holiday = np.random.choice([0, 1], p=[0.95, 0.05])
        event_nearby = np.random.choice([0, 1], p=[0.9, 0.1])
        
        # Add multipliers
        withdrawal = base_withdrawal
        if day_of_week >= 5: withdrawal *= 1.2 # Weekend
        if salary_week: withdrawal *= 1.5
        if holiday: withdrawal *= 1.3
        if event_nearby: withdrawal *= 2.0
        
        withdrawal = max(0, int(withdrawal)) # Ensure non-negative
        deposits = max(0, int(np.random.normal(200, 50)))
        current_cash = max(0, 50000 - withdrawal + deposits) # Simulating starting cash
        refill_needed = 1 if current_cash < 10000 else 0
        
        data.append({
            'atm_id': atm_id,
            'datetime': date,
            'withdrawals': withdrawal,
            'deposits': deposits,
            'current_cash': current_cash,
            'day_of_week': day_of_week,
            'salary_week': salary_week,
            'holiday': holiday,
            'event_nearby': event_nearby,
            'refill_needed': refill_needed
        })
        
    df = pd.DataFrame(data)
    df.to_csv('../dataset/atm_data.csv', index=False)
    print("Dataset generated and saved to ../dataset/atm_data.csv")
    return df

def train_model():
    print("Loading dataset...")
    df = pd.read_csv('../dataset/atm_data.csv')
    
    # Feature Engineering for Random Forest
    features = ['atm_id', 'day_of_week', 'salary_week', 'holiday', 'event_nearby']
    target = 'withdrawals'
    
    X = df[features]
    y = df[target]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    print("Evaluating Model...")
    predictions = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)
    
    print(f"RF MAE: {mae:.2f}, RMSE: {rmse:.2f}, R2: {r2:.2f}")
    
    model_path = '../models/cash_predictor.pkl'
    joblib.dump(model, model_path)
    print(f"Random Forest successfully saved to {model_path}")

    # --- CLUSTERING ---
    print("Training KMeans Clustering...")
    atm_stats = df.groupby('atm_id').agg({'withdrawals': 'mean', 'deposits': 'mean'}).reset_index()
    kmeans = KMeans(n_clusters=3, random_state=42)
    atm_stats['cluster'] = kmeans.fit_predict(atm_stats[['withdrawals', 'deposits']])
    joblib.dump(kmeans, '../models/atm_clusterer.pkl')
    # Save the reference map
    atm_stats.to_csv('../models/atm_clusters.csv', index=False)
    
    # --- ANOMALY DETECTION ---
    print("Training Isolation Forest Anomaly Detector...")
    iso_forest = IsolationForest(contamination=0.01, random_state=42)
    # We train it on all numerical features
    iso_features = ['withdrawals', 'deposits', 'current_cash']
    iso_forest.fit(df[iso_features])
    joblib.dump(iso_forest, '../models/anomaly_detector.pkl')
    
    # --- PROPHET PREDICTION ---
    print("Training Prophet Models for each ATM...")
    prophet_models = {}
    for atm_id in df['atm_id'].unique():
        atm_df = df[df['atm_id'] == atm_id].copy()
        # Prophet needs 'ds' and 'y' columns
        atm_df.rename(columns={'datetime': 'ds', 'withdrawals': 'y'}, inplace=True)
        
        # We'll use daily aggregation to make prophet training faster and more reliable
        atm_df['ds'] = pd.to_datetime(atm_df['ds']).dt.date
        daily_df = atm_df.groupby('ds')['y'].sum().reset_index()
        
        p_model = Prophet(yearly_seasonality=False, daily_seasonality=True)
        p_model.fit(daily_df)
        prophet_models[atm_id] = p_model
        
    joblib.dump(prophet_models, '../models/prophet_models.pkl')
    print("All ML modules successfully trained and saved!")

if __name__ == "__main__":
    os.makedirs('../dataset', exist_ok=True)
    generate_dataset()
    train_model()
