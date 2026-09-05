from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, JSON, Text, ForeignKey
from services.db import Base

class Alert(Base):
    __tablename__ = 'alerts'

    id = Column(String(64), primary_key=True)
    transaction_id = Column(String(64), ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False, index=True)
    account_id = Column(String(64), nullable=False, index=True)
    account_name = Column(String(128))
    alert_type = Column(String(64), default='RULE_VIOLATION')
    severity = Column(String(16), default='MEDIUM', index=True)
    message = Column(Text)
    risk_score = Column(Integer, default=0)
    status = Column(String(32), default='OPEN', index=True)
    assigned_analyst = Column(String(128))
    triggered_rules = Column(JSON, default=list)
    notes = Column(JSON, default=list)
    resolution_summary = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self, include_transaction=None):
        created_str = self.created_at.isoformat() if self.created_at else datetime.now(timezone.utc).isoformat()
        updated_str = self.updated_at.isoformat() if self.updated_at else created_str
        
        result = {
            "id": self.id,
            "transactionId": self.transaction_id,
            "accountId": self.account_id,
            "accountName": self.account_name or self.account_id,
            "riskScore": self.risk_score,
            "riskLevel": self.severity or ("CRITICAL" if self.risk_score >= 80 else "HIGH" if self.risk_score >= 60 else "MEDIUM"),
            "status": self.status or "OPEN",
            "assignedAnalyst": self.assigned_analyst or "Unassigned (Auto-Triage)",
            "createdAt": created_str,
            "updatedAt": updated_str,
            "triggeredRules": self.triggered_rules or [],
            "notes": self.notes or [],
            "resolutionSummary": self.resolution_summary or ""
        }
        
        if include_transaction:
            result["transaction"] = include_transaction.to_dict()
            
        return result
