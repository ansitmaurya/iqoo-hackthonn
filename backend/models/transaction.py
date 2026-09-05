from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, JSON
from services.db import Base

class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(String(64), primary_key=True)
    sender = Column(String(64), nullable=False, index=True)
    sender_name = Column(String(128))
    receiver = Column(String(64), index=True)
    receiver_name = Column(String(128))
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), default='USD')
    type = Column(String(32), default='TRANSFER')
    category = Column(String(64), default='PEER_TRANSFER')
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    location = Column(JSON, default=dict)
    device = Column(JSON, default=dict)
    status = Column(String(32), default='SETTLED', index=True)
    risk_score = Column(Integer, default=0, index=True)
    risk_level = Column(String(16), default='LOW')
    triggered_rules = Column(JSON, default=list)
    flagged = Column(Boolean, default=False)
    tx_metadata = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "accountId": self.sender,
            "accountName": self.sender_name or self.sender,
            "recipientId": self.receiver,
            "recipientName": self.receiver_name or self.receiver,
            "amount": float(self.amount) if self.amount is not None else 0.0,
            "currency": self.currency or "USD",
            "type": self.type or "TRANSFER",
            "category": self.category or "PEER_TRANSFER",
            "timestamp": self.timestamp.isoformat() if self.timestamp else datetime.now(timezone.utc).isoformat(),
            "location": self.location or {
                "city": "Unknown",
                "country": "US",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "ipAddress": "127.0.0.1"
            },
            "device": self.device or {
                "deviceId": "DEV-UNKNOWN",
                "browser": "Chrome",
                "os": "Windows",
                "isKnownDevice": True,
                "userAgent": "TraceGuard/2.0"
            },
            "riskScore": self.risk_score or 0,
            "riskLevel": self.risk_level or ("CRITICAL" if (self.risk_score or 0) >= 80 else "HIGH" if (self.risk_score or 0) >= 60 else "MEDIUM" if (self.risk_score or 0) >= 35 else "LOW"),
            "triggeredRules": self.triggered_rules or [],
            "flagged": bool(self.flagged),
            "status": self.status or "SETTLED",
            "metadata": self.tx_metadata or {}
        }
