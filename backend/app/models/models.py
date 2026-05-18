from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from app.database.connection import Base

def get_karachi_time():
    return datetime.utcnow() + timedelta(hours=5)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String, default="admin")

class ATM(Base):
    __tablename__ = "atms"
    id = Column(Integer, primary_key=True, index=True)
    location = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    current_cash = Column(Float, default=50000.0)
    status = Column(String, default="Active") # Active, Low Cash, Empty
    last_updated = Column(DateTime, default=get_karachi_time)

    transactions = relationship("Transaction", back_populates="atm")
    predictions = relationship("Prediction", back_populates="atm")
    refill_logs = relationship("RefillLog", back_populates="atm")
    alerts = relationship("Alert", back_populates="atm")
    refill_vehicles = relationship("RefillVehicle", back_populates="atm")

class RefillVehicle(Base):
    __tablename__ = "refill_vehicles"
    id = Column(Integer, primary_key=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    target_atm_id = Column(Integer, ForeignKey("atms.id"), nullable=True)
    status = Column(String, default="Idle") # Idle, En Route
    last_updated = Column(DateTime, default=get_karachi_time)

    atm = relationship("ATM", back_populates="refill_vehicles")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    atm_id = Column(Integer, ForeignKey("atms.id"))
    amount = Column(Float)
    transaction_type = Column(String) # withdrawal, deposit
    timestamp = Column(DateTime, default=get_karachi_time)

    atm = relationship("ATM", back_populates="transactions")

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(Integer, primary_key=True, index=True)
    atm_id = Column(Integer, ForeignKey("atms.id"))
    predicted_demand = Column(Float)
    prediction_date = Column(DateTime)
    llm_explanation = Column(String)

    atm = relationship("ATM", back_populates="predictions")

class RefillLog(Base):
    __tablename__ = "refill_logs"
    id = Column(Integer, primary_key=True, index=True)
    atm_id = Column(Integer, ForeignKey("atms.id"))
    amount_added = Column(Float)
    timestamp = Column(DateTime, default=get_karachi_time)
    previous_hash = Column(String)
    current_hash = Column(String)

    atm = relationship("ATM", back_populates="refill_logs")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    atm_id = Column(Integer, ForeignKey("atms.id"))
    message = Column(String)
    is_resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=get_karachi_time)

    atm = relationship("ATM", back_populates="alerts")

class NationalEvent(Base):
    __tablename__ = "national_events"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date_range = Column(String)
    impact = Column(String)
    demand_multiplier = Column(Float)
    description = Column(String)
    icon = Column(String, default="star")
    is_active = Column(Boolean, default=True)
