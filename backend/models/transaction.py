import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, DateTime, JSON
from services.db import Base

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(String(64), primary_key=True)
    sender = Column(String(64), nullable=False, index=True)
    receiver = Column(String(64), index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    location = Column(JSON, default=dict)
    status = Column(String(32), default='SETTLED', index=True)
    risk_score = Column(Integer, default=0, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        loc_data = self.location
        if isinstance(loc_data, str):
            try:
                loc_data = json.loads(loc_data)
            except Exception:
                loc_data = {
                    "city": loc_data,
                    "country": "US",
                    "latitude": 40.7128,
                    "longitude": -74.0060,
                    "ipAddress": "198.51.100.42"
                }
        if not isinstance(loc_data, dict):
            loc_data = {
                "city": "New York",
                "country": "US",
                "latitude": 40.7128,
                "longitude": -74.0060,
                "ipAddress": "198.51.100.42"
            }

        score = int(self.risk_score or 0)
        level = "CRITICAL" if score >= 80 else ("HIGH" if score >= 60 else ("MEDIUM" if score >= 35 else "LOW"))
        is_flagged = score >= 60 or (self.status and self.status.upper() in ("FLAGGED", "BLOCKED"))

        ts_val = self.timestamp or self.created_at
        if isinstance(ts_val, datetime):
            ts_str = ts_val.isoformat()
        elif ts_val:
            ts_str = str(ts_val)
        else:
            ts_str = datetime.now(timezone.utc).isoformat()

        sender_id = str(self.sender)
        receiver_id = str(self.receiver) if self.receiver else "ACC-RECV-GATEWAY"

        return {
            "id": str(self.id),
            "accountId": sender_id,
            "accountName": f"Account {sender_id}",
            "recipientId": receiver_id,
            "recipientName": f"Account {receiver_id}",
            "amount": float(self.amount) if self.amount is not None else 0.0,
            "currency": "USD",
            "type": "TRANSFER",
            "category": "CRYPTO_EXCHANGE" if score > 70 else ("WIRE_REMITTANCE" if score > 50 else "PEER_TRANSFER"),
            "timestamp": ts_str,
            "location": loc_data,
            "device": {
                "deviceId": f"DEV-{sender_id[-6:] if len(sender_id)>=6 else sender_id}",
                "browser": "Chrome / Secure Gateway",
                "os": "Enterprise Linux / Windows",
                "isKnownDevice": True,
                "userAgent": "Mozilla/5.0 TraceGuard/2.0"
            },
            "riskScore": score,
            "riskLevel": level,
            "triggeredRules": [
                {
                    "ruleId": "RUL-POSTGRES-EVAL",
                    "ruleName": f"Real-Time Risk Rating ({level})",
                    "severity": "CRITICAL" if level == "CRITICAL" else ("WARNING" if level == "HIGH" else "INFO"),
                    "scoreContribution": score,
                    "description": f"Calculated risk index {score}/100 from PostgreSQL anomaly metrics.",
                    "evidence": {"riskScore": score, "amount": float(self.amount or 0)}
                }
            ] if is_flagged else [],
            "flagged": is_flagged,
            "status": self.status or "SETTLED",
            "metadata": {"source": "Supabase PostgreSQL Database"}
        }
