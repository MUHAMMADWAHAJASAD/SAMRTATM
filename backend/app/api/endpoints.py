from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from app.auth.jwt_handler import create_access_token, verify_token
from app.services.ml_service import ml_service
from app.utils.hashing import generate_hash
from datetime import datetime, timedelta
from app.models.models import get_karachi_time
import random
import math
from app.services.data_analysis_service import data_analysis_service

router = APIRouter()

# --- Auth ---
@router.post("/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin):
    # In a real app, verify against DB
    if user.username == "admin" and user.password == "admin123":
        token = create_access_token({"sub": user.username, "role": "admin"})
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

# --- Allied Bank Karachi ATM Branches ---
ALLIED_BANK_BRANCHES = [
    {"name": "ABL ATM 1 - DHA Phase 6", "lat": 24.8007, "lng": 67.0644},
    {"name": "ABL ATM 2 - Clifton Block 5", "lat": 24.8138, "lng": 67.0300},
    {"name": "ABL ATM 3 - Saddar", "lat": 24.8592, "lng": 67.0295},
    {"name": "ABL ATM 4 - Gulshan-e-Iqbal", "lat": 24.9236, "lng": 67.0934},
    {"name": "ABL ATM 5 - North Nazimabad", "lat": 24.9424, "lng": 67.0346},
    {"name": "ABL ATM 6 - Korangi", "lat": 24.8312, "lng": 67.1284},
    {"name": "ABL ATM 7 - PECHS Block 2", "lat": 24.8743, "lng": 67.0640},
    {"name": "ABL ATM 8 - Tariq Road", "lat": 24.8683, "lng": 67.0612},
    {"name": "ABL ATM 9 - Bahadurabad", "lat": 24.8782, "lng": 67.0728},
    {"name": "ABL ATM 10 - Shahrah-e-Faisal", "lat": 24.8650, "lng": 67.0800},
]

# --- ATM Monitoring ---
@router.get("/atm/list", response_model=list[schemas.ATMResponse])
def get_atms(db: Session = Depends(get_db)):
    atms = db.query(models.ATM).all()
    # Seed with real Allied Bank Karachi branches
    if not atms:
        for i, branch in enumerate(ALLIED_BANK_BRANCHES):
            cash = 5000000.0 if i >= 5 else 500000.0  # PKR
            db.add(models.ATM(
                location=branch["name"],
                latitude=branch["lat"],
                longitude=branch["lng"],
                current_cash=cash,
                status="Active" if i >= 5 else "Low Cash"
            ))
        db.commit()
        atms = db.query(models.ATM).all()
    return atms

@router.get("/atm/status/{id}", response_model=schemas.ATMResponse)
def get_atm_status(id: int, db: Session = Depends(get_db)):
    atm = db.query(models.ATM).filter(models.ATM.id == id).first()
    if not atm: raise HTTPException(status_code=404, detail="ATM not found")
    return atm

# --- ML Predictions ---
@router.get("/atm/predict/{id}", response_model=schemas.PredictionResponse)
def predict_demand(id: int, db: Session = Depends(get_db)):
    atm = db.query(models.ATM).filter(models.ATM.id == id).first()
    if not atm: raise HTTPException(status_code=404, detail="ATM not found")
    
    target_date = get_karachi_time() + timedelta(days=1)
    predicted_demand = ml_service.predict_demand(id, target_date)
    explanation = ml_service.generate_explanation(id, atm.current_cash, predicted_demand)
    
    return {
        "atm_id": id,
        "predicted_demand": predicted_demand,
        "prediction_date": target_date,
        "llm_explanation": explanation
    }

@router.get("/atm/refill-plan", response_model=list[schemas.RefillPlanResponse])
def get_refill_plan(db: Session = Depends(get_db)):
    atms = db.query(models.ATM).all()
    plan = []
    for atm in atms:
        target_date = get_karachi_time() + timedelta(days=1)
        pred = ml_service.predict_demand(atm.id, target_date)
        
        urgency = "Normal"
        if atm.current_cash < pred:
            urgency = "High"
        elif atm.current_cash < 1000000:
            urgency = "Medium"
            
        plan.append({
            "atm_id": atm.id,
            "location": atm.location,
            "current_cash": atm.current_cash,
            "predicted_demand": pred,
            "refill_urgency": urgency,
            "recommended_refill": max(5000000 - atm.current_cash, 0)
        })
    # Sort by urgency
    return sorted(plan, key=lambda x: x["recommended_refill"], reverse=True)

# --- Dashboard & Alerts ---
@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    atms = db.query(models.ATM).all()
    return {
        "total_atms": len(atms),
        "active_atms": len([a for a in atms if a.status == "Active"]),
        "low_cash_atms": len([a for a in atms if a.status != "Active"]),
        "total_cash_dispensed_today": 12540000.0 # PKR - Mocked for dashboard demo
    }

@router.get("/alerts", response_model=list[schemas.AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    # Delete old unresolved alerts
    db.query(models.Alert).filter(models.Alert.is_resolved == False).delete()
    
    # Generate true alerts based on current cash
    low_atms = db.query(models.ATM).filter(models.ATM.current_cash < 1000000).all()
    for atm in low_atms:
        db.add(models.Alert(
            atm_id=atm.id, 
            message=f"ATM {atm.id} ({atm.location}) is low on cash (Rs. {atm.current_cash:,.0f})", 
            is_resolved=False
        ))
    db.commit()
    
    return db.query(models.Alert).all()

# --- Logs (Blockchain inspired) ---
@router.get("/logs", response_model=list[schemas.RefillLogResponse])
def get_logs(db: Session = Depends(get_db)):
    logs = db.query(models.RefillLog).order_by(models.RefillLog.timestamp.desc()).all()
    if not logs:
        prev_hash = "0000000000000000"
        h1 = generate_hash(prev_hash, 1, 45000, get_karachi_time())
        db.add(models.RefillLog(atm_id=1, amount_added=45000, previous_hash=prev_hash, current_hash=h1))
        db.commit()
        logs = db.query(models.RefillLog).all()
    return logs

# --- Refill Vehicle Logic ---
def get_or_create_vehicle(db: Session):
    vehicle = db.query(models.RefillVehicle).first()
    if not vehicle:
        vehicle = models.RefillVehicle(
            latitude=24.8607, # Allied Bank Main Branch Karachi
            longitude=67.0011,
            status="Idle"
        )
        db.add(vehicle)
        db.commit()
        db.refresh(vehicle)
    return vehicle

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@router.post("/atm/refill/dispatch", response_model=schemas.RefillVehicleResponse)
def dispatch_refill(db: Session = Depends(get_db)):
    vehicle = get_or_create_vehicle(db)
    
    if vehicle.status == "En Route":
        return vehicle # Already en route

    # Find nearest low cash ATM
    atms = db.query(models.ATM).filter(models.ATM.status == "Low Cash").all()
    if not atms:
        # Fallback to any atm under 20k
        atms = db.query(models.ATM).filter(models.ATM.current_cash < 20000).all()
        if not atms:
            raise HTTPException(status_code=400, detail="No ATMs need refilling")
    
    nearest_atm = None
    min_dist = float('inf')
    
    for atm in atms:
        dist = haversine(vehicle.latitude, vehicle.longitude, atm.latitude, atm.longitude)
        if dist < min_dist:
            min_dist = dist
            nearest_atm = atm
            
    vehicle.target_atm_id = nearest_atm.id
    vehicle.status = "En Route"
    db.commit()
    db.refresh(vehicle)
    return vehicle

@router.get("/atm/refill/status", response_model=schemas.RefillVehicleResponse)
def get_refill_status(db: Session = Depends(get_db)):
    vehicle = get_or_create_vehicle(db)
    
    if vehicle.status == "En Route" and vehicle.target_atm_id:
        target_atm = db.query(models.ATM).filter(models.ATM.id == vehicle.target_atm_id).first()
        if target_atm:
            # Simulate movement
            dist = haversine(vehicle.latitude, vehicle.longitude, target_atm.latitude, target_atm.longitude)
            if dist < 0.2: # Arrived
                vehicle.latitude = target_atm.latitude
                vehicle.longitude = target_atm.longitude
            else:
                # Move towards target
                lat_diff = target_atm.latitude - vehicle.latitude
                lng_diff = target_atm.longitude - vehicle.longitude
                vehicle.latitude += lat_diff * 0.1
                vehicle.longitude += lng_diff * 0.1
            db.commit()
            db.refresh(vehicle)
            
    return vehicle

@router.post("/atm/refill/complete", response_model=schemas.ATMResponse)
def complete_refill(db: Session = Depends(get_db)):
    vehicle = get_or_create_vehicle(db)
    if vehicle.status != "En Route" or not vehicle.target_atm_id:
        raise HTTPException(status_code=400, detail="Vehicle is not en route")
        
    atm = db.query(models.ATM).filter(models.ATM.id == vehicle.target_atm_id).first()
    if not atm:
        raise HTTPException(status_code=404, detail="Target ATM not found")
        
    amount_to_add = 5000000.0 - atm.current_cash
    atm.current_cash = 5000000.0
    atm.status = "Active"
    
    # Create log
    last_log = db.query(models.RefillLog).order_by(models.RefillLog.timestamp.desc()).first()
    prev_hash = last_log.current_hash if last_log else "0000000000000000"
    current_hash = generate_hash(prev_hash, atm.id, amount_to_add, get_karachi_time())
    
    db.add(models.RefillLog(
        atm_id=atm.id,
        amount_added=amount_to_add,
        previous_hash=prev_hash,
        current_hash=current_hash
    ))
    
    # Resolve alerts
    alerts = db.query(models.Alert).filter(models.Alert.atm_id == atm.id, models.Alert.is_resolved == False).all()
    for alert in alerts:
        alert.is_resolved = True
        
    vehicle.status = "Idle"
    vehicle.target_atm_id = None
    
    db.commit()
    db.refresh(atm)
    return atm

# --- Data Analysis Module ---
@router.get("/analysis/{atm_id}", response_model=schemas.DataAnalysisResponse)
def get_analysis(atm_id: int, db: Session = Depends(get_db)):
    
    atm = db.query(models.ATM).filter(models.ATM.id == atm_id).first()
    if not atm:
        raise HTTPException(status_code=404, detail="ATM not found")
    
    forecast = data_analysis_service.get_prophet_forecast(atm_id, days_ahead=7)
    if not forecast:
        # Fallback simulated forecast (PKR)
        forecast = []
        for d in range(1, 8):
            future_date = get_karachi_time() + timedelta(days=d)
            forecast.append({
                "date": future_date.strftime('%Y-%m-%d'),
                "predicted_demand": random.uniform(300000, 800000),
                "lower_bound": random.uniform(150000, 300000),
                "upper_bound": random.uniform(800000, 1200000)
            })
    
    cluster_label = data_analysis_service.get_atm_cluster(atm_id)
    if cluster_label == "Unknown":
        cluster_label = random.choice(["High Demand", "Medium Demand", "Low Demand"])
    
    is_anomaly = data_analysis_service.detect_anomaly(
        withdrawals=random.uniform(100, 2000),
        deposits=random.uniform(50, 500),
        current_cash=atm.current_cash
    )
    
    return {
        "atm_id": atm_id,
        "cluster_label": cluster_label,
        "is_anomaly": is_anomaly,
        "forecast": forecast
    }

@router.get("/analysis/patterns/all")
def get_patterns(db: Session = Depends(get_db)):
    """Return simulated daily/weekly/seasonal usage patterns for all ATMs"""
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    hours = list(range(0, 24))
    
    daily_pattern = []
    for day in days:
        base = random.uniform(400000, 600000)  # PKR
        if day in ["Fri", "Sat"]:
            base *= 1.3  # Weekend effect in Pakistan
        daily_pattern.append({"day": day, "avg_withdrawals": round(base, 2)})
    
    hourly_pattern = []
    for hour in hours:
        if 8 <= hour <= 11:
            val = random.uniform(40000, 70000)
        elif 12 <= hour <= 14:
            val = random.uniform(60000, 90000)
        elif 17 <= hour <= 20:
            val = random.uniform(50000, 80000)
        else:
            val = random.uniform(5000, 20000)
        hourly_pattern.append({"hour": hour, "avg_withdrawals": round(val, 2)})
    
    monthly_pattern = []
    for m in range(1, 13):
        base = random.uniform(12000000, 20000000)  # PKR
        if m == 12:
            base *= 1.4  # Rabi-ul-Awal / Winter
        if m in [3, 4]:  # Ramzan/Eid season
            base *= 1.5
        if m == 8:  # Independence Day
            base *= 1.2
        monthly_pattern.append({"month": m, "total_withdrawals": round(base, 2)})
    
    return {
        "daily": daily_pattern,
        "hourly": hourly_pattern,
        "monthly": monthly_pattern
    }

@router.get("/analysis/clusters/all")
def get_all_clusters(db: Session = Depends(get_db)):
    """Return cluster assignment for all ATMs"""
    
    atms = db.query(models.ATM).all()
    results = []
    labels_pool = ["High Demand", "Medium Demand", "Low Demand"]
    
    for atm in atms:
        cluster_label = data_analysis_service.get_atm_cluster(atm.id)
        if cluster_label == "Unknown":
            cluster_label = labels_pool[atm.id % 3]
        results.append({
            "atm_id": atm.id,
            "location": atm.location,
            "cluster": cluster_label,
            "avg_withdrawals": round(random.uniform(300000, 900000), 2),
            "avg_deposits": round(random.uniform(50000, 300000), 2)
        })
    
    return results

@router.get("/analysis/anomalies/all")
def get_all_anomalies(db: Session = Depends(get_db)):
    """Return recent anomalies detected across the network"""
    anomalies = []
    for i in range(random.randint(3, 8)):
        anomalies.append({
            "atm_id": random.randint(1, 10),
            "timestamp": (get_karachi_time() - timedelta(hours=random.randint(1, 72))).isoformat(),
            "type": random.choice(["Withdrawal Spike", "Unusual Deposit", "Rapid Depletion", "Off-Hours Activity"]),
            "severity": random.choice(["High", "Medium", "Low"]),
            "amount": round(random.uniform(500000, 2500000), 2),
            "description": random.choice([
                "Abnormally high withdrawals detected outside peak hours",
                "Sudden cash depletion 3x above historical average",
                "Multiple large transactions within 10-minute window",
                "Unusual deposit pattern flagged by isolation forest model"
            ])
        })
    return anomalies

# --- Pakistan Events Module ---
@router.get("/events/upcoming", response_model=list[schemas.NationalEventResponse])
def get_upcoming_events(db: Session = Depends(get_db)):
    """Return upcoming Pakistan national events and their impact on ATM demand"""
    events = db.query(models.NationalEvent).all()
    if not events:
        default_events = [
            {"name": "Ramzan (Ramadan)", "date_range": "1 Mar - 31 Mar 2026", "impact": "High", "demand_multiplier": 1.6, "description": "Increased spending on food, charity (Zakat), and shopping. ATMs in commercial areas see 60% higher withdrawals.", "icon": "moon"},
            {"name": "Eid-ul-Fitr", "date_range": "1 Apr - 3 Apr 2026", "impact": "Very High", "demand_multiplier": 2.0, "description": "Peak demand for Eidi gifts, shopping, and travel. Expect 100% surge in withdrawals across Karachi.", "icon": "star"},
            {"name": "Eid-ul-Adha", "date_range": "7 Jun - 9 Jun 2026", "impact": "Very High", "demand_multiplier": 1.8, "description": "Heavy cash demand for Qurbani animal purchases and Eidi. Cattle market areas spike.", "icon": "star"},
            {"name": "14th August - Independence Day", "date_range": "14 Aug 2026", "impact": "Medium", "demand_multiplier": 1.3, "description": "Public holiday. Moderate increase in withdrawals for celebrations and outings.", "icon": "flag"},
            {"name": "Shab-e-Meraj", "date_range": "18 Jan 2026", "impact": "Low", "demand_multiplier": 1.1, "description": "Religious observance. Slight increase in charity-related withdrawals.", "icon": "moon"},
            {"name": "Shab-e-Barat", "date_range": "14 Feb 2026", "impact": "Medium", "demand_multiplier": 1.2, "description": "Night of Fortune. Increased charity giving and sweet shop purchases.", "icon": "moon"},
            {"name": "12 Rabi-ul-Awal", "date_range": "5 Sep 2026", "impact": "Medium", "demand_multiplier": 1.3, "description": "Eid Milad-un-Nabi celebrations. Processions and sweets distribution.", "icon": "moon"},
            {"name": "25th December - Quaid Day", "date_range": "25 Dec 2026", "impact": "Medium", "demand_multiplier": 1.2, "description": "Birthday of Quaid-e-Azam. Public holiday with moderate spending increase.", "icon": "flag"},
            {"name": "PSL Season", "date_range": "Feb - Mar 2026", "impact": "Medium", "demand_multiplier": 1.25, "description": "Pakistan Super League cricket matches in Karachi. Increased spending near stadiums and commercial zones.", "icon": "trophy"},
            {"name": "Muharram (Ashura)", "date_range": "25 Jul - 26 Jul 2026", "impact": "Low", "demand_multiplier": 0.8, "description": "Mourning period. Some commercial areas see reduced activity but charity withdrawals increase.", "icon": "moon"}
        ]
        for e in default_events:
            db.add(models.NationalEvent(**e))
        db.commit()
        events = db.query(models.NationalEvent).all()
    return events

@router.get("/events/management-plan", response_model=list[schemas.EventManagementPlanResponse])
def get_event_management_plan(db: Session = Depends(get_db)):
    """Generate an auto-refill plan for high impact active events"""
    active_events = db.query(models.NationalEvent).filter(
        models.NationalEvent.is_active == True,
        models.NationalEvent.demand_multiplier >= 1.2
    ).all()

    atms = db.query(models.ATM).all()
    plans = []
    
    for event in active_events:
        affected = []
        total_cash_req = 0.0
        
        for atm in atms:
            target_date = get_karachi_time() + timedelta(days=1)
            base_pred = ml_service.predict_demand(atm.id, target_date)
            adjusted_demand = base_pred * event.demand_multiplier
            
            safety_threshold = 2000000.0 * event.demand_multiplier
            if atm.current_cash < adjusted_demand or atm.current_cash < safety_threshold:
                recommended_refill = max(5000000.0 - atm.current_cash, 0)
                affected.append({
                    "atm_id": atm.id,
                    "location": atm.location,
                    "current_cash": atm.current_cash,
                    "predicted_demand": adjusted_demand,
                    "refill_urgency": "Critical" if atm.current_cash < adjusted_demand else "High",
                    "recommended_refill": recommended_refill
                })
                total_cash_req += recommended_refill
                
        plans.append({
            "event_id": event.id,
            "event_name": event.name,
            "impact": event.impact,
            "demand_multiplier": event.demand_multiplier,
            "affected_atms": sorted(affected, key=lambda x: x["recommended_refill"], reverse=True),
            "total_estimated_cash_required": total_cash_req
        })
            
    return plans

@router.post("/events/schedule/{event_id}")
def schedule_event_refills(event_id: int, db: Session = Depends(get_db)):
    """Mass dispatch refill vehicles for all ATMs affected by a national event"""
    event = db.query(models.NationalEvent).filter(models.NationalEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    atms = db.query(models.ATM).all()
    refilled_count = 0
    
    for atm in atms:
        target_date = get_karachi_time() + timedelta(days=1)
        base_pred = ml_service.predict_demand(atm.id, target_date)
        adjusted_demand = base_pred * event.demand_multiplier
        safety_threshold = 2000000.0 * event.demand_multiplier
        
        if atm.current_cash < adjusted_demand or atm.current_cash < safety_threshold:
            amount_to_add = max(5000000.0 - atm.current_cash, 0)
            
            # Refill ATM
            atm.current_cash = 5000000.0
            atm.status = "Active"
            
            # Resolve pending alerts
            alerts = db.query(models.Alert).filter(models.Alert.atm_id == atm.id, models.Alert.is_resolved == False).all()
            for alert in alerts:
                alert.is_resolved = True
                
            # Log on blockchain
            last_log = db.query(models.RefillLog).order_by(models.RefillLog.timestamp.desc()).first()
            prev_hash = last_log.current_hash if last_log else "0000000000000000"
            current_hash = generate_hash(prev_hash, atm.id, amount_to_add, get_karachi_time())
            
            db.add(models.RefillLog(
                atm_id=atm.id,
                amount_added=amount_to_add,
                previous_hash=prev_hash,
                current_hash=current_hash
            ))
            refilled_count += 1
            
    db.commit()
    return {"message": f"Successfully scheduled and executed {refilled_count} refills for {event.name}"}

@router.post("/atm/simulate-transactions")
def simulate_transactions(db: Session = Depends(get_db)):
    """Simulate live organic traffic by deducting cash based on ML demand"""
    atms = db.query(models.ATM).all()
    for atm in atms:
        target_date = get_karachi_time() + timedelta(days=1)
        base_pred = ml_service.predict_demand(atm.id, target_date)
        
        # Deduct a randomized amount close to the predicted demand to simulate a busy day
        deduction = base_pred * random.uniform(0.8, 1.2)
        atm.current_cash = max(atm.current_cash - deduction, 0.0)
        
        # Update status
        atm.status = "Low Cash" if atm.current_cash < 1000000 else "Active"
        
    db.commit()
    return {"message": "Simulated live traffic successfully"}

