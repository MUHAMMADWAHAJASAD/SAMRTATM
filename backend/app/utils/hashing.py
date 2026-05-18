import hashlib
import json
from datetime import datetime

def generate_hash(previous_hash: str, atm_id: int, amount: float, timestamp: datetime) -> str:
    """Blockchain inspired hashing for logs"""
    data = f"{previous_hash}{atm_id}{amount}{timestamp.isoformat()}"
    return hashlib.sha256(data.encode('utf-8')).hexdigest()
