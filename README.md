# AI-Powered Smart ATM Infrastructure Optimization and Real-Time Cash Monitoring System

## Project Overview
This project is a comprehensive cloud-enabled smart ATM management system. It aims to solve the problem of inefficient cash refill schedules and ATM downtime by providing real-time cash monitoring, predictive analytics for cash demand, and optimized refill route generation.

The project fulfills requirements for:
1. **Cloud Computing**: Containerized deployment, scalable microservice architecture, and instructions for Azure Cloud integration.
2. **Data Mining / Machine Learning**: Real-time prediction of ATM cash demand using Scikit-Learn `RandomForestRegressor`.

## Features
- **Real-time ATM Monitoring**: Dashboard for monitoring the live status and cash levels of all ATMs.
- **Predictive Analytics**: Predicts next-day cash demand for each ATM to avoid empty states.
- **Smart Refill Optimization**: Identifies and prioritizes ATMs that critically need refills.
- **Blockchain-Inspired Logging**: Refill logs with cryptographic hashing to maintain tamper-evident audit trails.
- **LLM Explanation Module**: Generates natural language summaries explaining *why* an ATM needs a refill.
- **Role-Based Auth**: Secure JWT authentication.

## Architecture Stack
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL, PyJWT
- **Machine Learning**: Scikit-Learn, Pandas, Joblib (Random Forest Regressor)
- **DevOps**: Docker, Docker Compose

## Quick Start (Local Deployment)

### 1. Generate Dataset and Train Model (Optional, pre-trained model included)
To re-train the model, run the Jupyter notebooks located in `ml/notebooks/`. 

### 2. Run with Docker Compose
Ensure you have Docker and Docker Compose installed.

```bash
docker-compose up --build
```

### 3. Access the System
- **Frontend App**: `http://localhost:5173`
- **Backend API Docs**: `http://localhost:8000/docs`
- **Database**: `localhost:5432`

## API Documentation
Once the backend is running, you can access the auto-generated Swagger UI at `/docs`.
Key endpoints:
- `POST /auth/login`
- `GET /atm/list`
- `GET /atm/predict/{id}`
- `GET /logs`

## Future Enhancements
- Live integration with Google Maps API for actual route optimization.
- Replace simulated data with live banking datasets.
- Implement real-time websocket connections for live cash decrement tracking.
