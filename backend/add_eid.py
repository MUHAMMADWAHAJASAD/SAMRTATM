from app.database.connection import SessionLocal
from app.models import models

def add_eid_event():
    db = SessionLocal()
    existing = db.query(models.NationalEvent).filter(models.NationalEvent.name == "Eid-ul-Fitr").first()
    if not existing:
        db.add(models.NationalEvent(
            name="Eid-ul-Fitr",
            date_range="20 Mar - 23 Mar 2026",
            impact="Very High",
            demand_multiplier=2.0,
            description="End of Ramadan. Massive cash withdrawals for Eidi and shopping.",
            icon="moon",
            is_active=True
        ))
        db.commit()
        print("Successfully added Eid-ul-Fitr event to the database.")
    else:
        print("Eid-ul-Fitr event already exists.")
    db.close()

if __name__ == "__main__":
    add_eid_event()
