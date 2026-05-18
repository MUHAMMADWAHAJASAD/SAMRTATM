from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ATMResponse(BaseModel):
    id: int
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    current_cash: float
    status: str
    last_updated: datetime

    class Config:
        from_attributes = True

class PredictionResponse(BaseModel):
    atm_id: int
    predicted_demand: float
    prediction_date: datetime
    llm_explanation: str

class ProphetForecast(BaseModel):
    date: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float

class DataAnalysisResponse(BaseModel):
    atm_id: int
    cluster_label: str
    is_anomaly: bool
    forecast: List[ProphetForecast]

class RefillPlanResponse(BaseModel):
    atm_id: int
    location: str
    current_cash: float
    predicted_demand: float
    refill_urgency: str
    recommended_refill: float

class AlertResponse(BaseModel):
    id: int
    atm_id: int
    message: str
    is_resolved: bool
    timestamp: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_atms: int
    active_atms: int
    low_cash_atms: int
    total_cash_dispensed_today: float

class RefillVehicleResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    target_atm_id: Optional[int] = None
    status: str
    last_updated: datetime

    class Config:
        from_attributes = True

class RefillLogResponse(BaseModel):
    id: int
    atm_id: int
    amount_added: float
    timestamp: datetime
    previous_hash: str
    current_hash: str

    class Config:
        from_attributes = True

class NationalEventResponse(BaseModel):
    id: int
    name: str
    date_range: str
    impact: str
    demand_multiplier: float
    description: str
    icon: str
    is_active: bool

    class Config:
        from_attributes = True

class NationalEventCreate(BaseModel):
    name: str
    date_range: str
    impact: str
    demand_multiplier: float
    description: str
    icon: str
    is_active: bool = True

class EventManagementPlanResponse(BaseModel):
    event_id: int
    event_name: str
    impact: str
    demand_multiplier: float
    affected_atms: List[RefillPlanResponse]
    total_estimated_cash_required: float
