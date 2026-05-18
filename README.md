# Smart ATM Infrastructure Optimization & Real-Time Monitoring System

## 🎓 Academic Viva Voce & Project Documentation

Welcome to the complete technical documentation for the **Smart ATM Infrastructure Optimization** system. This document is specifically designed to explain the architecture, algorithms, codebase, and workflows for your academic viva.

---

## 1. Project Overview & Problem Statement
Traditional ATM networks suffer from static, time-based refill schedules. This leads to two massive inefficiencies:
1. **Cash Outages:** High-traffic ATMs run out of cash during peak times or national events, causing customer dissatisfaction.
2. **Dead Capital:** Low-traffic ATMs hold millions of idle rupees that could otherwise be invested or utilized by the bank.

**The Solution:**
This project introduces a **Cloud-Enabled, AI-Powered Smart ATM System**. It uses Machine Learning to predict exact cash demands based on historical data, localizes management for Karachi (using PKR currency), and features a real-time event simulator that automatically dispatches refill vehicles based on mathematical demand multipliers.

---

## 2. Technology Stack & Rationale
*   **Frontend (React + Vite + Tailwind CSS):** We chose React for its component-based architecture, allowing us to build a seamless, single-page application (SPA). Tailwind CSS enables rapid UI prototyping, ensuring a modern, glass-morphic design. Recharts is used for dynamic data visualization.
*   **Backend (FastAPI + Python):** FastAPI is a high-performance Python framework. It was chosen because it handles asynchronous HTTP requests brilliantly and integrates natively with our Machine Learning pipelines (Scikit-Learn/Pandas).
*   **Database (SQLite / SQLAlchemy ORM):** To ensure a 100% free and easy cloud deployment, the database utilizes an embedded SQLite engine mapped via SQLAlchemy ORM. This avoids the need for heavy, expensive cloud PostgreSQL servers while maintaining full relational integrity.
*   **Machine Learning (Scikit-Learn):** A `RandomForestRegressor` model predicts the cash demand. Random Forests are highly robust against overfitting and handle non-linear time-series data (like weekend vs. weekday spending) excellently.
*   **DevOps & Cloud (Docker + Render/Vercel):** The system is containerized via Docker for local parity, and deployed via Render's `render.yaml` Blueprint (Infrastructure as Code) for zero-configuration cloud hosting.

---

## 3. How the Core Workflows Operate

### A. Machine Learning Cash Demand Prediction
**What it does:** Predicts exactly how much cash an ATM will dispense tomorrow.
**How it happens (Code Level):**
1. In `backend/app/services/ml_service.py`, a pre-trained `joblib` Random Forest model is loaded into memory.
2. When the backend needs a prediction, it generates a feature vector: `[atm_id, day_of_week, salary_week, holiday, event_nearby]`. For example, if the current date is the 26th, `salary_week` becomes `1`.
3. The model feeds this array into the regression tree and outputs the predicted demand in PKR.

### B. Live Traffic Simulation (Organic Depletion)
**What it does:** Allows the viva examiner to see the ATMs naturally lose cash as if customers are actively withdrawing money.
**How it happens (Code Level):**
1. The user clicks "Simulate Traffic" on the frontend Dashboard.
2. A `POST /atm/simulate-transactions` request hits `endpoints.py`.
3. The backend calculates the ML-predicted demand for each ATM, multiplies it by a slight randomized noise factor `random.uniform(0.8, 1.2)`, and subtracts it from the `atm.current_cash`.
4. If an ATM drops below `1,000,000 PKR`, its status flips to "Low Cash".

### C. Truth-Based Real-Time Alerts
**What it does:** Warns the bank manager the exact second an ATM reaches critical levels.
**How it happens (Code Level):**
1. The frontend Dashboard aggressively polls the `GET /alerts` endpoint.
2. In `endpoints.py`, the system deletes all old, unresolved alerts. It then runs a fresh SQL query: `db.query(models.ATM).filter(models.ATM.current_cash < 1000000).all()`.
3. For every ATM returned, a new Alert object is instantiated. If the ATM is refilled later, it no longer triggers this query, meaning the alert naturally resolves and vanishes from the UI.

### D. National Event Mass Scheduling
**What it does:** Anticipates massive cash rushes during events like *Eid-ul-Fitr* or *Ramzan* and preemptively calculates exactly how much cash to dispatch.
**How it happens (Code Level):**
1. The `GET /events/management-plan` loops through every active national event.
2. It takes the base ML prediction and multiplies it by the event's `demand_multiplier` (e.g., 2.0x for Eid).
3. It sets a new `safety_threshold` (e.g., 2,000,000 * 2.0 = 4,000,000 PKR).
4. If the ATM's current cash is below this massive threshold, it flags it as `Critical` and adds it to the "Affected ATMs" array.
5. When the user clicks **Schedule Complete Event Refill**, `POST /events/schedule/{event_id}` executes, resetting the cash of all affected ATMs to their maximum capacity (5,000,000 PKR) and generating a Blockchain log.

### E. Blockchain-Inspired Audit Logging
**What it does:** Ensures that no one can tamper with the refill history.
**How it happens (Code Level):**
1. In `hashing.py`, a cryptographic `SHA-256` hash is generated.
2. When a refill occurs, the `generate_hash` function takes the `previous_hash` from the last log in the database, combines it with the current `atm_id`, `amount_added`, and the exact `timestamp` (synced to Karachi time UTC+5), and produces a `current_hash`.
3. This creates an unbreakable chain. If an auditor changes the amount of a past refill, the current hash will no longer match the next log's previous hash, exposing the fraud.

---

## 4. Complete Code Structure

### Backend (`/backend`)
*   `app/main.py`: The entry point. Initializes FastAPI, sets up CORS, connects the database engine, and automatically creates the tables.
*   `app/api/endpoints.py`: The brain of the API. Contains every route (Dashboard Stats, Alerts, Event Planning, Refill Dispatch, Simulator).
*   `app/database/connection.py`: Connects to SQLite using `sqlalchemy.create_engine`. Ensures thread safety.
*   `app/models/models.py`: Defines the SQLAlchemy ORM tables (`User`, `ATM`, `Transaction`, `Alert`, `RefillLog`, `NationalEvent`). All default times are forced to Karachi local time.
*   `app/schemas/schemas.py`: Pydantic models. These define the strict JSON shapes that the API expects to receive and return, ensuring data validation.
*   `app/services/ml_service.py`: Interfaces with the pre-trained Scikit-Learn `.pkl` file.

### Frontend (`/frontend`)
*   `src/pages/Dashboard.jsx`: The primary analytic hub. Uses `Recharts` to draw the Current vs. Predicted bar charts. Contains the "Simulate Traffic" interactive button.
*   `src/pages/Events.jsx`: Manages the mathematical Event multipliers. Contains the expand/collapse state for viewing precise ATM refill tables.
*   `src/pages/RefillReports.jsx`: Renders the Blockchain logs, showing exact timestamps, PKRs dispensed, and full SHA-256 hash chains.
*   `src/services/api.js`: An `axios` interceptor setup that centralizes all API calls to the FastAPI backend, pulling the base URL from the environment variable (`VITE_API_URL`).

---

## 5. Deployment Architecture
The project utilizes **Render.com** (Backend API) and **Vercel** (Frontend UI).
*   The `render.yaml` file is an Infrastructure-as-Code (IaC) blueprint. When pushed to Render, it detects the Python environment, runs `pip install -r requirements.txt`, and executes `uvicorn` using the dynamic `$PORT` provided by Render's cloud load balancers.
*   Because we utilize an embedded `SQLite` database, the entire backend functions flawlessly on Render's free tier without demanding a credit card for managed Postgres servers.

---
*Good luck with your Viva Voce! You have built a complete, intelligent, and scalable fintech product.*
