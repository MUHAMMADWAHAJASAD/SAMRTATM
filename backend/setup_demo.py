from app.database.connection import SessionLocal
from app.models import models

def setup_demo_state():
    db = SessionLocal()
    
    # 1. Deplete exactly 5 ATMs
    atms = db.query(models.ATM).order_by(models.ATM.id).all()
    for i, atm in enumerate(atms):
        if i < 5:
            atm.current_cash = 500000.0
            atm.status = "Low Cash"
        else:
            atm.current_cash = 5000000.0
            atm.status = "Active"
    
    # 2. Add Ramzan Event
    existing = db.query(models.NationalEvent).filter(models.NationalEvent.name == "Ramzan (Ramadan)").first()
    if not existing:
        db.add(models.NationalEvent(
            name="Ramzan (Ramadan)",
            date_range="18 Feb - 19 Mar 2026",
            impact="High",
            demand_multiplier=1.6,
            description="Holy month of fasting. Increased cash withdrawals for charity and daily groceries.",
            icon="moon",
            is_active=True
        ))
        
    db.commit()
    print("Successfully depleted 5 ATMs and added Ramzan event.")
    db.close()

if __name__ == "__main__":
    setup_demo_state()
